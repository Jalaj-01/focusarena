import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan, Between } from 'typeorm';
import { Challenge } from './challenge.entity';
import { User } from '../users/user.entity';
import { Participant } from '../participants/participant.entity';
import { Badge } from '../badges/badge.entity';
import { UserBadge } from '../badges/user-badge.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { Cron, CronExpression } from '@nestjs/schedule';
import { addToQueue, findMatch as queueMatch, removeFromQueue } from './matchmaking.queue';

@Injectable()
export class ChallengesService {
  // --- ECONOMIC CONSTANTS (HOUSE-TREASURY MODEL) ---
  private readonly SOLO_BONUS_RATE = 0.05;      // 5% Target Bonus
  private readonly GROUP_BONUS_CAP_RATE = 0.40; // 40% Max Bonus
  private readonly MAX_STAKE_PER_MINUTE = 20;
  private readonly DAILY_REWARD_LIMIT = 5;

  // --- XP & TIER CONSTANTS ---
  private readonly SOLO_BASE_XP = 20;
  private readonly GROUP_BASE_XP = 40;
  private readonly HIGH_STAKE_THRESHOLD = 1000;
  private readonly HIGH_STAKE_MIN_LEVEL = 10;

  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    @InjectRepository(Challenge) private challengeRepo: Repository<Challenge>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Participant) private participantRepo: Repository<Participant>,
    @InjectRepository(Badge) private badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge) private userBadgeRepo: Repository<UserBadge>,
    @Inject(forwardRef(() => RealtimeGateway))
    private gateway: RealtimeGateway,
  ) {}

  // ==========================================
  // 🔥 CORE REWARD ENGINE (TREASURY MODEL)
  // ==========================================

  private async finalizeChallengeRewards(challengeId: string) {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
      relations: ['participants', 'participants.user'],
    });

    if (!challenge || challenge.status === 'completed') return;

    const participants = challenge.participants;
    const stake = Number(challenge.stake);
    const duration = Number(challenge.duration_minutes);

    const winners = participants.filter(p => (Number(p.warnings) || 0) < 4);
    const losers = participants.filter(p => (Number(p.warnings) || 0) >= 4);

    const isSoloFallback = challenge.type === 'solo' || participants.length <= 1;

    if (isSoloFallback) {
      await this.processSoloRewards(challenge, winners, losers, stake, duration);
    } else {
      await this.processGroupRewards(challenge, winners, losers, stake, duration);
    }

    challenge.status = 'completed';
    await this.challengeRepo.save(challenge);

    if (this.gateway.server) {
      this.gateway.server.emit('challenge_finalized', { challengeId });
    }
  }

  /**
   * SOLO REWARDS
   * Return = (Stake * Mult) + (5% Bonus * Mult)
   */
  private async processSoloRewards(challenge: Challenge, winners: Participant[], losers: Participant[], stake: number, duration: number) {
    for (const p of challenge.participants) {
      const user = await this.userRepo.findOne({ where: { id: p.user.id } });
      if (!user) continue;

      const warnings = Number(p.warnings) || 0;
      const multiplier = this.getTreasuryMultiplier(warnings);
      const canEarnCoins = await this.checkDailyRewardEligibility(user.id);

      if (warnings < 4) {
        // Winner gets slashed stake + slashed 5% bonus
        const stakeReturn = Math.floor(stake * multiplier);
        const baseBonus = stake * this.SOLO_BONUS_RATE;
        const netBonus = canEarnCoins ? Math.floor(baseBonus * multiplier) : 0;

        user.coins = Number(user.coins) + stakeReturn + netBonus;
        user.wins = (Number(user.wins) || 0) + 1;
        user.streak = (Number(user.streak) || 0) + 1;
        user.xp = (Number(user.xp) || 0) + this.SOLO_BASE_XP + duration;
      } else {
        // Failed gets 10% refund
        user.coins = Number(user.coins) + Math.floor(stake * multiplier);
        user.losses = (Number(user.losses) || 0) + 1;
        user.streak = 0;
        user.xp = (Number(user.xp) || 0) + 5;
      }
      await this.saveUserProgress(user, p, challenge);
    }
  }

  /**
   * GROUP REWARDS
   * redistributed fines from violators to winners (capped at 40%)
   */
  private async processGroupRewards(challenge: Challenge, winners: Participant[], losers: Participant[], stake: number, duration: number) {
    let penaltyPool = 0;

    // 1. Fill Pool with fines from everyone
    for (const p of challenge.participants) {
      const mult = this.getTreasuryMultiplier(Number(p.warnings) || 0);
      penaltyPool += (stake - Math.floor(stake * mult));
    }

    // 2. Determine "Winner Units" to split pool fairly
    const winnerUnits = winners.reduce((sum, p) => sum + this.getTreasuryMultiplier(Number(p.warnings) || 0), 0);
    const rawBonusPerUnit = winnerUnits > 0 ? Math.floor(penaltyPool / winnerUnits) : 0;
    const finalBonusPerUnit = Math.min(rawBonusPerUnit, Math.floor(stake * this.GROUP_BONUS_CAP_RATE));

    // 3. Payout
    for (const p of challenge.participants) {
      const user = await this.userRepo.findOne({ where: { id: p.user.id } });
      if (!user) continue;

      const warnings = Number(p.warnings) || 0;
      const multiplier = this.getTreasuryMultiplier(warnings);
      const canEarnCoins = await this.checkDailyRewardEligibility(user.id);

      if (warnings < 4) {
        const stakeReturn = Math.floor(stake * multiplier);
        const bonusReturn = canEarnCoins ? Math.floor(finalBonusPerUnit * multiplier) : 0;

        user.coins = Number(user.coins) + stakeReturn + bonusReturn;
        user.wins = (Number(user.wins) || 0) + 1;
        user.streak = (Number(user.streak) || 0) + 1;
        user.xp = (Number(user.xp) || 0) + this.GROUP_BASE_XP + duration;
      } else {
        user.coins = Number(user.coins) + Math.floor(stake * multiplier);
        user.losses = (Number(user.losses) || 0) + 1;
        user.streak = 0;
        user.xp = (Number(user.xp) || 0) + 5;
      }
      await this.saveUserProgress(user, p, challenge);
    }
  }

  private getTreasuryMultiplier(strikes: number): number {
    if (strikes === 0) return 1.0; 
    if (strikes === 1) return 0.9; 
    if (strikes === 2) return 0.70; // 30% Fine (Symmetric stair-case)
    if (strikes === 3) return 0.5; 
    return 0.1;                    // Fail gets 10% back
  }

  // ==========================================
  // 🔥 PERSISTENCE & UTILITIES
  // ==========================================

  private async saveUserProgress(user: User, participant: Participant, challenge: Challenge) {
    user.level = Math.floor((Number(user.xp) || 0) / 100) + 1;
    await this.userRepo.save(user);
    await this.assignBadges(user, participant, challenge);
  }

  private async assignBadges(user: User, p: Participant, c: Challenge) {
    const hour = new Date().getHours();
    const day = new Date().getDay();
    const isWinner = (Number(p.warnings) || 0) < 4;

    const rules = [
      { name: 'First Win', cond: isWinner && Number(user.wins) >= 1, desc: 'Earned your first victory!' },
      { name: 'Streak Master', cond: isWinner && Number(user.streak) >= 5, desc: 'Unstoppable for 5 sessions!' },
      { name: 'Double Digit', cond: isWinner && Number(user.streak) >= 10, desc: 'Hit a 10 win streak!' },
      { name: 'God Mode', cond: isWinner && Number(user.streak) >= 25, desc: 'Legendary 25 streak!' },
      { name: 'Elite Focuser', cond: Number(user.level) >= 10, desc: 'Reached Level 10!' },
      { name: 'Pro Challenger', cond: Number(user.wins) >= 25, desc: 'Completed 25 focus wins!' },
      { name: 'Master of Focus', cond: Number(user.wins) >= 50, desc: 'Completed 50 focus wins!' },
      { name: 'Centurion', cond: Number(user.wins) >= 100, desc: 'Completed 100 focus wins!' },
      { name: 'Rich Player', cond: Number(user.coins) >= 5000, desc: 'Amassed a fortune of 5,000 coins!' },
      { name: 'Zen Master', cond: isWinner && Number(p.warnings) === 0, desc: 'Finished with 0 warnings!' },
      { name: 'High Roller', cond: isWinner && Number(c.stake) >= 1000, desc: 'Won a 1000+ coin stake!' },
      { name: 'Marathoner', cond: isWinner && Number(c.duration_minutes) >= 60, desc: 'Won a 60+ minute session!' },
      { name: 'Early Bird', cond: isWinner && hour >= 4 && hour <= 8, desc: 'Conquered the morning (4am-8am)!' },
      { name: 'Night Owl', cond: isWinner && (hour >= 23 || hour <= 3), desc: 'Mastered the midnight (11pm-3am)!' },
      { name: 'Weekend Warrior', cond: isWinner && (day === 0 || day === 6), desc: 'Pushed through the weekend!' }
    ];

    for (const r of rules) {
      if (!r.cond) continue;
      let b = await this.badgeRepo.findOne({ where: { name: r.name } });
      if (!b) b = await this.badgeRepo.save(this.badgeRepo.create({ name: r.name, description: r.desc }));
      const exists = await this.userBadgeRepo.findOne({ where: { user: { id: user.id }, badge: { id: b.id } } });
      if (!exists) await this.userBadgeRepo.save(this.userBadgeRepo.create({ user, badge: b }));
    }
  }

  private async checkDailyRewardEligibility(userId: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const count = await this.participantRepo.count({
      where: { user: { id: userId }, challenge: { status: 'completed', created_at: Between(startOfDay, new Date()) } }
    });
    return count < this.DAILY_REWARD_LIMIT;
  }

  // --- API & CRUD METHODS ---

  async incrementWarning(challengeId: string, userId: string) {
    const participant = await this.participantRepo.findOne({ where: { challenge: { id: challengeId }, user: { id: userId } } });
    if (!participant) throw new NotFoundException('Participant not found');
    participant.warnings = (Number(participant.warnings) || 0) + 1;
    await this.participantRepo.save(participant);
    if (participant.warnings >= 4 && (await this.challengeRepo.findOne({ where: { id: challengeId } }))?.type === 'solo') {
        await this.finalizeChallengeRewards(challengeId);
    }
    return { status: participant.warnings >= 4 ? 'failed' : 'active', warnings: participant.warnings };
  }

  private async ensureNoActiveChallenge(userId: string) {
    const active = await this.participantRepo.findOne({ where: { user: { id: userId }, challenge: { status: In(['active', 'pending']), is_archived: false } }, relations: ['challenge'] });
    if (active) {
      const c = active.challenge;
      if (c.status === 'active' && c.end_time && new Date() > new Date(c.end_time)) { await this.finalizeChallengeRewards(c.id); return; }
      if (c.status === 'pending') { await this.challengeRepo.update(c.id, { is_archived: true }); return; }
      throw new BadRequestException('Finish current session.');
    }
  }

  async createChallenge(body: any, userPayload: any) {
    await this.ensureNoActiveChallenge(userPayload.userId);
    const { title, stake, duration_minutes, type, status } = body;
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    if (!user) throw new NotFoundException('User not found');
    if (Number(stake) > this.HIGH_STAKE_THRESHOLD && user.level < this.HIGH_STAKE_MIN_LEVEL) throw new BadRequestException(`Level ${this.HIGH_STAKE_MIN_LEVEL} required.`);
    if (Number(stake) > Number(duration_minutes) * this.MAX_STAKE_PER_MINUTE) throw new BadRequestException('Stake too high.');
    if (Number(user.coins) < Number(stake)) throw new BadRequestException('Insufficient balance.');
    await this.userRepo.decrement({ id: user.id }, 'coins', Number(stake));
    const challenge = await this.challengeRepo.save(this.challengeRepo.create({ title: title || 'Focus Session', stake: Number(stake), duration_minutes: Number(duration_minutes), type: type || 'solo', status: status || 'pending', is_archived: false }));
    await this.participantRepo.save(this.participantRepo.create({ user, challenge, warnings: 0 }));
    return challenge;
  }

  async joinChallenge(challengeId: string, userPayload: any) {
    await this.ensureNoActiveChallenge(userPayload.userId);
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId }, relations: ['participants'] });
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    if (!challenge || !user || challenge.status !== 'pending' || Number(user.coins) < Number(challenge.stake)) throw new BadRequestException('Cannot join.');
    await this.userRepo.decrement({ id: user.id }, 'coins', Number(challenge.stake));
    await this.participantRepo.save(this.participantRepo.create({ user, challenge, warnings: 0 }));
    if (this.gateway.server) this.gateway.server.emit('user_joined', { challengeId, userId: user.id });
    return { message: 'Joined' };
  }

  async startChallenge(id: string, userPayload?: any) {
    const c = await this.challengeRepo.findOne({ where: { id }, relations: ['participants', 'participants.user'] });
    if (!c || (userPayload && c.participants[0]?.user.id !== userPayload.userId)) throw new ForbiddenException('Unauthorized.');
    c.status = 'active';
    c.start_time = new Date();
    c.end_time = new Date(Date.now() + Number(c.duration_minutes) * 60000);
    const saved = await this.challengeRepo.save(c);
    if (this.gateway.server) this.gateway.server.emit('challenge_started', { challengeId: id });
    return saved;
  }

  async invalidateChallenge(id: string) { await this.challengeRepo.update(id, { status: 'completed', is_archived: true }); return { message: 'Invalidated' }; }
  async getAll(userPayload?: any) { return await this.getAllChallenges(userPayload); }
  async getAllChallenges(userPayload?: any) {
    const all = await this.challengeRepo.find({ where: { is_archived: false }, order: { created_at: 'DESC' }, relations: ['participants', 'participants.user'] });
    if (!userPayload?.userId) return all;
    return all.filter(c => c.type === 'group' || c.participants.some(p => p.user.id === userPayload.userId));
  }
  async getChallengeById(id: string) { return await this.challengeRepo.findOne({ where: { id }, relations: ['participants', 'participants.user'] }); }
  async deleteChallenge(id: string, userId: string) {
    const challenge = await this.getChallengeById(id);
    if (!challenge || challenge.participants[0]?.user.id !== userId) throw new ForbiddenException('Unauthorized.');
    for (const p of challenge.participants) await this.userRepo.increment({ id: p.user.id }, 'coins', Number(challenge.stake));
    challenge.is_archived = true;
    await this.challengeRepo.save(challenge);
    return { message: 'Deleted' };
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkExpiredChallenges() {
    const expired = await this.challengeRepo.find({ where: { status: 'active', end_time: LessThan(new Date()), is_archived: false } });
    for (const c of expired) await this.finalizeChallengeRewards(c.id);
  }

  async kickParticipant(challengeId: string, participantId: string, userPayload: any) {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge || challenge.participants[0]?.user.id !== userPayload.userId) throw new ForbiddenException('Unauthorized.');
    await this.userRepo.increment({ id: participantId }, 'coins', Number(challenge.stake));
    await this.participantRepo.delete({ challenge: { id: challengeId }, user: { id: participantId } });
    if (this.gateway.server) this.gateway.server.emit('user_kicked', { challengeId, userId: participantId });
    return { message: 'Kicked' };
  }

  async completeChallenge(challengeId: string, userPayload: any, body?: any) { await this.finalizeChallengeRewards(challengeId); return { message: 'Finalized' }; }
  async submitProof(challengeId: string, userPayload: any, body: any) { await this.challengeRepo.update(challengeId, { proof_url: body.proof_url }); return { message: 'Submitted' }; }

  async findMatch(query: any, userPayload: any) {
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    if (!user) throw new NotFoundException('User not found');
    const match = queueMatch({ userId: user.id, level: user.level, stake: Number(query.stake), type: query.type });
    if (match) {
      removeFromQueue(match.userId);
      return this.createChallenge({ title: 'Battle Arena', stake: Number(query.stake), duration_minutes: query.duration_minutes || 30, type: 'group', status: 'active' }, userPayload);
    }
    addToQueue({ userId: user.id, level: user.level, stake: Number(query.stake), type: query.type });
    return { message: 'Searching...' };
  }
}