import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
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
  private readonly PLATFORM_FEE_RATE = 0.20; 
  private readonly LOSER_CONSOLATION_RATE = 0.10; 
  private readonly SOLO_FAIL_REFUND_RATE = 0.30; 
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

  // --- 🔥 CORE REWARD ENGINE ---
  private async finalizeChallengeRewards(challengeId: string) {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
      relations: ['participants', 'participants.user'],
    });

    if (!challenge || challenge.status === 'completed') return;

    const participants = challenge.participants;
    const stake = Number(challenge.stake);

    for (const p of participants) {
        const user = await this.userRepo.findOne({ where: { id: p.user.id } });
        if (!user) continue;

        // Anti-cheat: Strike 4 (and above) is a failure
        const isWinner = (Number(p.warnings) || 0) < 4;

        if (challenge.type === 'solo') {
            if (isWinner) {
                const bonusMultiplier = Math.min((challenge.duration_minutes / 5) * 0.005, 0.50);
                const profit = Math.max(Math.floor(stake * bonusMultiplier), 1);
                // Atomic increment to ensure coins are never lost
                await this.userRepo.increment({ id: user.id }, 'coins', stake + profit);
                user.wins = (Number(user.wins) || 0) + 1;
                user.xp = (Number(user.xp) || 0) + 50;
                user.streak = (Number(user.streak) || 0) + 1;
            } else {
                const refund = Math.floor(stake * this.SOLO_FAIL_REFUND_RATE);
                await this.userRepo.increment({ id: user.id }, 'coins', refund);
                user.losses = (Number(user.losses) || 0) + 1;
                user.streak = 0;
            }
        } else {
            const winners = participants.filter(part => (Number(part.warnings) || 0) < 4);
            const losers = participants.filter(part => (Number(part.warnings) || 0) >= 4);

            if (winners.find(w => w.id === p.id)) {
                const totalLoserStake = losers.length * stake;
                const share = winners.length > 0 ? Math.floor((totalLoserStake * (1 - this.PLATFORM_FEE_RATE - this.LOSER_CONSOLATION_RATE)) / winners.length) : 0;
                await this.userRepo.increment({ id: user.id }, 'coins', stake + share);
                user.wins = (Number(user.wins) || 0) + 1;
                user.xp = (Number(user.xp) || 0) + 75;
                user.streak = (Number(user.streak) || 0) + 1;
            } else {
                const refund = Math.floor(stake * this.LOSER_CONSOLATION_RATE);
                await this.userRepo.increment({ id: user.id }, 'coins', refund);
                user.losses = (Number(user.losses) || 0) + 1;
                user.streak = 0;
            }
        }
        await this.saveUserProgress(user);
    }

    challenge.status = 'completed';
    await this.challengeRepo.save(challenge);
    if (this.gateway.server) {
        this.gateway.server.emit('challenge_finalized', { challengeId });
    }
  }

  // 🔥 PERSISTENT ANTI-CHEAT
  async incrementWarning(challengeId: string, userId: string) {
    const participant = await this.participantRepo.findOne({
        where: { challenge: { id: challengeId }, user: { id: userId } }
    });
    if (!participant) throw new NotFoundException('Participant not found');

    participant.warnings = (Number(participant.warnings) || 0) + 1;
    await this.participantRepo.save(participant);

    if (participant.warnings >= 4) {
        await this.finalizeChallengeRewards(challengeId);
        return { status: 'failed', warnings: participant.warnings };
    }
    return { status: 'active', warnings: participant.warnings };
  }

  async deleteChallenge(id: string, userId: string) {
    const challenge = await this.challengeRepo.findOne({
      where: { id },
      relations: ['participants', 'participants.user']
    });

    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.status !== 'pending') throw new BadRequestException('Cannot delete live challenge.');

    for (const p of challenge.participants) {
        await this.userRepo.increment({ id: p.user.id }, 'coins', Number(challenge.stake));
    }

    challenge.is_archived = true;
    await this.challengeRepo.save(challenge);
    return { message: 'Challenge deleted and coins refunded.' };
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkExpiredChallenges() {
    const expired = await this.challengeRepo.find({ 
        where: { status: 'active', end_time: LessThan(new Date()) } 
    });
    for (const c of expired) {
        await this.finalizeChallengeRewards(c.id);
    }
  }

  private async saveUserProgress(user: User) {
    user.level = Math.floor((Number(user.xp) || 0) / 100) + 1;
    await this.assignBadges(user);
    const { coins, ...otherStats } = user;
    await this.userRepo.update(user.id, otherStats);
  }

  private async ensureNoActiveChallenge(userId: string) {
    const active = await this.participantRepo.findOne({
      where: { user: { id: userId }, challenge: { status: In(['active', 'pending']), is_archived: false } },
      relations: ['challenge']
    });
    if (active) {
        const c = active.challenge;
        if (c.end_time && new Date() > c.end_time) {
            await this.finalizeChallengeRewards(c.id);
        } else {
            throw new BadRequestException('Finish your current session first.');
        }
    }
  }

  async createChallenge(body: any, userPayload: any) {
    await this.ensureNoActiveChallenge(userPayload.userId);
    const { title, stake, duration_minutes, type, status } = body;
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    if (!user || Number(user.coins) < Number(stake)) throw new BadRequestException('Insufficient balance.');

    await this.userRepo.decrement({ id: user.id }, 'coins', Number(stake));

    const challenge = this.challengeRepo.create({
      title: title || 'Focus Session', 
      stake: Number(stake), 
      duration_minutes: Number(duration_minutes), 
      type: type || 'solo', 
      status: status || 'pending', 
      is_archived: false
    });

    // 🔥 FIX: Set start and end time if the challenge is created as ACTIVE (e.g., Matchmaking)
    if (status === 'active') {
        const now = new Date();
        challenge.start_time = now;
        challenge.end_time = new Date(now.getTime() + Number(duration_minutes) * 60000);
    }

    const savedChallenge = await this.challengeRepo.save(challenge);
    await this.participantRepo.save(this.participantRepo.create({ user, challenge: savedChallenge, warnings: 0 }));
    return savedChallenge;
  }

  async joinChallenge(challengeId: string, userPayload: any) {
    await this.ensureNoActiveChallenge(userPayload.userId);
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    
    if (!challenge || !user) throw new NotFoundException('Data not found');
    if (Number(user.coins) < Number(challenge.stake)) throw new BadRequestException('Insufficient coins.');

    await this.userRepo.decrement({ id: user.id }, 'coins', Number(challenge.stake));
    await this.participantRepo.save(this.participantRepo.create({ user, challenge, warnings: 0 }));
    
    if (this.gateway.server) {
        this.gateway.server.emit('user_joined', { challengeId, userId: user.id });
    }
    return { message: 'Joined' };
  }

  async completeChallenge(challengeId: string, userPayload: any, body?: any) {
    await this.finalizeChallengeRewards(challengeId);
    return { message: 'Challenge finalized.' };
  }

  async submitProof(challengeId: string, userPayload: any, body: any) {
    await this.challengeRepo.update(challengeId, { proof_url: body.proof_url });
    return { message: 'Proof submitted' };
  }

  async invalidateChallenge(id: string) {
    await this.challengeRepo.update(id, { status: 'completed', is_archived: true });
    return { message: 'Invalidated' };
  }

  async getAll() { return await this.getAllChallenges(); }

  async getAllChallenges() { 
    return await this.challengeRepo.find({ 
        where: { is_archived: false }, 
        order: { created_at: 'DESC' },
        relations: ['participants', 'participants.user'],
        take: 30
    }); 
  }

  async getChallengeById(id: string) { 
    return await this.challengeRepo.findOne({ 
        where: { id }, 
        relations: ['participants', 'participants.user'] 
    }); 
  }

  async startChallenge(id: string) {
    const c = await this.challengeRepo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Not found');
    
    c.status = 'active';
    const now = new Date();
    c.start_time = now;
    c.end_time = new Date(now.getTime() + Number(c.duration_minutes) * 60000);
    
    return await this.challengeRepo.save(c);
  }

  private async assignBadges(user: User) {
    const rules = [
        { name: 'First Win', condition: user.wins === 1 }, 
        { name: 'Streak Master', condition: user.streak === 5 }
    ];
    for (const r of rules) {
      if (!r.condition) continue;
      let b = await this.badgeRepo.findOne({ where: { name: r.name } });
      if (!b) b = await this.badgeRepo.save(this.badgeRepo.create({ name: r.name, description: 'Earned!' }));
      const exists = await this.userBadgeRepo.findOne({ where: { user: { id: user.id }, badge: { id: b.id } } });
      if (!exists) await this.userBadgeRepo.save(this.userBadgeRepo.create({ user, badge: b }));
    }
  }

  async findMatch(query: any, userPayload: any) {
    const { stake, type, duration_minutes } = query;
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    
    if (!user) throw new NotFoundException('User not found');

    const queueUser = { userId: user.id, level: user.level, stake: Number(stake), type };
    const match = queueMatch(queueUser);
    
    if (match) {
      removeFromQueue(match.userId);
      return this.createChallenge({ 
          title: 'Battle Arena', 
          stake: Number(stake), 
          duration_minutes: duration_minutes || 30, 
          type: 'group', 
          status: 'active' 
      }, userPayload);
    }
    
    addToQueue(queueUser);
    return { message: 'Searching...' };
  }
}