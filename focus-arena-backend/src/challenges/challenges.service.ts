// import { Injectable, BadRequestException, NotFoundException, Logger, Inject, forwardRef, ForbiddenException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, In, LessThan, Between } from 'typeorm';
// import { Challenge } from './challenge.entity';
// import { User } from '../users/user.entity';
// import { Participant } from '../participants/participant.entity';
// import { Badge } from '../badges/badge.entity';
// import { UserBadge } from '../badges/user-badge.entity';
// import { RealtimeGateway } from '../realtime/realtime.gateway';
// import { Cron, CronExpression } from '@nestjs/schedule';
// import { addToQueue, findMatch as queueMatch, removeFromQueue } from './matchmaking.queue';

// @Injectable()
// export class ChallengesService {
// // --- ECONOMIC CONSTANTS ---
// private readonly PLATFORM_FEE_RATE = 0.20;
// private readonly LOSER_CONSOLATION_RATE = 0.10;
// private readonly SOLO_FAIL_REFUND_RATE = 0.30;
// private readonly MAX_STAKE_PER_MINUTE = 20;
// private readonly DAILY_REWARD_LIMIT = 5;

// // --- XP & TIER CONSTANTS ---
// private readonly SOLO_BASE_XP = 20;
// private readonly GROUP_BASE_XP = 40;
// private readonly HIGH_STAKE_THRESHOLD = 1000;
// private readonly HIGH_STAKE_MIN_LEVEL = 10;

// private readonly logger = new Logger(ChallengesService.name);

// constructor(
// @InjectRepository(Challenge) private challengeRepo: Repository<Challenge>,
// @InjectRepository(User) private userRepo: Repository<User>,
// @InjectRepository(Participant) private participantRepo: Repository<Participant>,
// @InjectRepository(Badge) private badgeRepo: Repository<Badge>,
// @InjectRepository(UserBadge) private userBadgeRepo: Repository<UserBadge>,
// @Inject(forwardRef(() => RealtimeGateway))
// private gateway: RealtimeGateway,
// ) {}

// // ==========================================
// // 🔥 CORE REWARD ENGINE
// // ==========================================

// private async finalizeChallengeRewards(challengeId: string) {
// const challenge = await this.challengeRepo.findOne({
// where: { id: challengeId },
// relations: ['participants', 'participants.user'],
// });

// if (!challenge || challenge.status === 'completed') return;

// const participants = challenge.participants;
// const stake = Number(challenge.stake);
// const duration = Number(challenge.duration_minutes);

// const winners = participants.filter(p => (Number(p.warnings) || 0) < 4);
// const losers = participants.filter(p => (Number(p.warnings) || 0) >= 4);

// const isSoloFallback = challenge.type === 'solo' || participants.length <= 1;

// if (isSoloFallback) {
//     await this.processSoloRewards(challenge, winners, losers, stake, duration);
// } else {
//     await this.processGroupRewards(challenge, winners, losers, stake, duration);
// }

// challenge.status = 'completed';
// await this.challengeRepo.save(challenge);

// if (this.gateway.server) {
//     this.gateway.server.emit('challenge_finalized', { challengeId });
// }

// }

// private async processSoloRewards(challenge: Challenge, winners: Participant[], losers: Participant[], stake: number, duration: number) {
// for (const p of challenge.participants) {
//     const user = await this.userRepo.findOne({ where: { id: p.user.id } });
//     if (!user) continue;

//     const isWinner = (Number(p.warnings) || 0) < 4;
//     const canEarnCoins = await this.checkDailyRewardEligibility(user.id);

//     if (isWinner) {
//         const bonusMultiplier = Math.min((duration / 5) * 0.005, 0.50);
//         const strikeTax = this.getStrikeTaxMultiplier(Number(p.warnings));
//         const baseProfit = Math.max(Math.floor(stake * bonusMultiplier), 1);
//         const netProfit = canEarnCoins ? Math.floor(baseProfit * strikeTax) : 0;

//         user.coins = Number(user.coins) + stake + netProfit;
//         user.wins = (Number(user.wins) || 0) + 1;
//         user.streak = (Number(user.streak) || 0) + 1;
//         user.xp = (Number(user.xp) || 0) + this.SOLO_BASE_XP + duration;
//     } else {
//         const refund = Math.floor(stake * this.SOLO_FAIL_REFUND_RATE);
//         user.coins = Number(user.coins) + refund;
//         user.losses = (Number(user.losses) || 0) + 1;
//         user.streak = 0;
//         user.xp = (Number(user.xp) || 0) + 5; 
//     }
//     await this.saveUserProgress(user);
// }

// }

// private async processGroupRewards(challenge: Challenge, winners: Participant[], losers: Participant[], stake: number, duration: number) {
// const totalLoserStake = losers.length * stake;
// const platformFee = Math.floor(totalLoserStake * this.PLATFORM_FEE_RATE);
// const totalConsolation = Math.floor(totalLoserStake * this.LOSER_CONSOLATION_RATE);
// const netBountyPool = totalLoserStake - platformFee - totalConsolation;


// for (const p of losers) {
//     const user = await this.userRepo.findOne({ where: { id: p.user.id } });
//     if (!user) continue;
//     const refund = Math.floor(stake * this.LOSER_CONSOLATION_RATE);
//     user.coins = Number(user.coins) + refund;
//     user.losses = (Number(user.losses) || 0) + 1;
//     user.streak = 0;
//     user.xp = (Number(user.xp) || 0) + 5;
//     await this.saveUserProgress(user);
// }

// const sharePerWinner = winners.length > 0 ? Math.floor(netBountyPool / winners.length) : 0;
// for (const p of winners) {
//     const user = await this.userRepo.findOne({ where: { id: p.user.id } });
//     if (!user) continue;

//     const canEarnCoins = await this.checkDailyRewardEligibility(user.id);
//     const strikeTax = this.getStrikeTaxMultiplier(Number(p.warnings));
//     const profit = canEarnCoins ? Math.floor(sharePerWinner * strikeTax) : 0;

//     user.coins = Number(user.coins) + stake + profit;
//     user.wins = (Number(user.wins) || 0) + 1;
//     user.streak = (Number(user.streak) || 0) + 1;
//     user.xp = (Number(user.xp) || 0) + this.GROUP_BASE_XP + duration;
//     await this.saveUserProgress(user);
// }

// }

// private async saveUserProgress(user: User) {
// // Update Level
// user.level = Math.floor((Number(user.xp) || 0) / 100) + 1;

// // Atomic save for all stats including Coins
// await this.userRepo.save(user);

// // Handle Badges after saving main stats
// await this.assignBadges(user);
// }

// private async assignBadges(user: User) {
// const rules = [
// { name: 'First Win', cond: user.wins === 1, desc: 'Earned your first victory!' },
// { name: 'Streak Master', cond: user.streak === 5, desc: 'Unstoppable for 5 sessions!' },
// { name: 'Elite Focuser', cond: user.level >= 10, desc: 'Reached Level 10!' }
// ];
// for (const r of rules) {
// if (!r.cond) continue;
// let b = await this.badgeRepo.findOne({ where: { name: r.name } });
// if (!b) b = await this.badgeRepo.save(this.badgeRepo.create({ name: r.name, description: r.desc }));
// const exists = await this.userBadgeRepo.findOne({ where: { user: { id: user.id }, badge: { id: b.id } } });
// if (!exists) await this.userBadgeRepo.save(this.userBadgeRepo.create({ user, badge: b }));
// }
// }

// private getStrikeTaxMultiplier(strikes: number): number {
// if (strikes === 0) return 1.0;
// if (strikes === 1) return 0.9;
// if (strikes === 2) return 0.7;
// if (strikes === 3) return 0.5;
// return 0;
// }

// private async checkDailyRewardEligibility(userId: string): Promise<boolean> {
// const startOfDay = new Date();
// startOfDay.setHours(0, 0, 0, 0);
// const count = await this.participantRepo.count({
// where: {
// user: { id: userId },
// challenge: { status: 'completed', created_at: Between(startOfDay, new Date()) }
// }
// });
// return count < this.DAILY_REWARD_LIMIT;
// }

// async incrementWarning(challengeId: string, userId: string) {
// const participant = await this.participantRepo.findOne({
// where: { challenge: { id: challengeId }, user: { id: userId } }
// });
// if (!participant) throw new NotFoundException('Participant not found');

// participant.warnings = (Number(participant.warnings) || 0) + 1;
// await this.participantRepo.save(participant);

// if (participant.warnings >= 4) {
//     const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
//     if (challenge?.type === 'solo') {
//         await this.finalizeChallengeRewards(challengeId);
//     }
//     return { status: 'failed', warnings: participant.warnings };
// }
// return { status: 'active', warnings: participant.warnings };

// }

// private async ensureNoActiveChallenge(userId: string) {
//   const active = await this.participantRepo.findOne({
//     where: {
//       user: { id: userId },
//       challenge: { status: In(['active', 'pending']), is_archived: false }
//     },
//     relations: ['challenge']
//   });

//   if (active) {
//     const c = active.challenge;
//     if (c.status === 'active' && c.end_time && new Date() > new Date(c.end_time)) {
//       await this.finalizeChallengeRewards(c.id);
//       return;
//     }
//     if (c.status === 'pending') {
//       await this.challengeRepo.update(c.id, { is_archived: true });
//       return;
//     }
//     throw new BadRequestException('Finish your current session first.');
//   }
// }

// // ==========================================
// // 🔥 CHALLENGE CRUD & API
// // ==========================================

// async createChallenge(body: any, userPayload: any) {
// await this.ensureNoActiveChallenge(userPayload.userId);

// const { title, stake, duration_minutes, type, status } = body;
// const numStake = Number(stake);
// const numDuration = Number(duration_minutes);

// const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
// if (!user) throw new NotFoundException('User not found');

// if (numStake > this.HIGH_STAKE_THRESHOLD && user.level < this.HIGH_STAKE_MIN_LEVEL) {
//     throw new BadRequestException(`High Stake arenas require Level ${this.HIGH_STAKE_MIN_LEVEL}.`);
// }

// if (numStake > numDuration * this.MAX_STAKE_PER_MINUTE) {
//     throw new BadRequestException(`Max stake for ${numDuration} mins is ${numDuration * this.MAX_STAKE_PER_MINUTE} coins.`);
// }

// if (Number(user.coins) < numStake) throw new BadRequestException('Insufficient balance.');

// await this.userRepo.decrement({ id: user.id }, 'coins', numStake);

// const challenge = this.challengeRepo.create({
//   title: title || 'Focus Session', 
//   stake: numStake, 
//   duration_minutes: numDuration, 
//   type: type || 'solo', 
//   status: status || 'pending', 
//   is_archived: false
// });

// const savedChallenge = await this.challengeRepo.save(challenge);
// await this.participantRepo.save(this.participantRepo.create({ user, challenge: savedChallenge, warnings: 0 }));
// return savedChallenge;

// }

// async joinChallenge(challengeId: string, userPayload: any) {
// await this.ensureNoActiveChallenge(userPayload.userId);
// const challenge = await this.challengeRepo.findOne({ where: { id: challengeId }, relations: ['participants'] });
// const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });

// if (!challenge || !user) throw new NotFoundException('Data not found');
// if (Number(user.coins) < Number(challenge.stake)) throw new BadRequestException('Insufficient coins.');
// if (challenge.status !== 'pending') throw new BadRequestException('Challenge already started.');

// await this.userRepo.decrement({ id: user.id }, 'coins', Number(challenge.stake));
// await this.participantRepo.save(this.participantRepo.create({ user, challenge, warnings: 0 }));

// if (this.gateway.server) {
//     this.gateway.server.emit('user_joined', { challengeId, userId: user.id });
// }
// return { message: 'Joined' };
// }

// async startChallenge(id: string, userPayload?: any) {
//     const c = await this.challengeRepo.findOne({ 
//       where: { id }, 
//       relations: ['participants', 'participants.user'] 
//     });

//     if (!c) throw new NotFoundException('Challenge not found');

//     c.participants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
//     const hostId = c.participants[0]?.user.id;

//     if (userPayload && hostId !== userPayload.userId) {
//         throw new ForbiddenException('Only the Arena Host can launch this battle.');
//     }

//     if (c.type === 'group' && c.participants.length < 2) {
//         throw new BadRequestException('Wait for at least one player to join before launching.');
//     }

//     c.status = 'active';
//     const now = new Date();
//     c.start_time = now;
//     c.end_time = new Date(now.getTime() + Number(c.duration_minutes) * 60000);
//     const saved = await this.challengeRepo.save(c);

//     if (this.gateway.server) {
//         this.gateway.server.emit('challenge_started', { challengeId: id });
//     }
//     return saved;
// }

// // ==========================================
// // 🔥 FETCHING & MATCHMAKING
// // ==========================================

// async getAll(userPayload?: any) { return await this.getAllChallenges(userPayload); }

// async getAllChallenges(userPayload?: any) {
//   const userId = userPayload?.userId;
//   const all = await this.challengeRepo.find({
//     where: { is_archived: false },
//     order: { created_at: 'DESC' },
//     relations: ['participants', 'participants.user'],
//   });

//   all.forEach(c => {
//     if (c.participants) {
//       c.participants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
//     }
//   });

//   if (!userId) return all;

//   return all.filter(c => {
//     if (c.type === 'group') return true;
//     if (c.type === 'solo') return c.participants.some(p => p.user.id === userId);
//     return false;
//   });
// }

// async getChallengeById(id: string) {
//     const challenge = await this.challengeRepo.findOne({
//     where: { id },
//     relations: ['participants', 'participants.user']
//     });
//     if (challenge && challenge.participants) {
//         challenge.participants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
//     }
//     return challenge;
// }

// async deleteChallenge(id: string, userId: string) {
//     const challenge = await this.getChallengeById(id);
//     if (!challenge) throw new NotFoundException('Challenge not found');
    
//     if (challenge.participants[0]?.user.id !== userId) throw new ForbiddenException('Only host can cancel.');
//     if (challenge.status !== 'pending') throw new BadRequestException('Cannot delete live challenge.');

//     for (const p of challenge.participants) {
//         await this.userRepo.increment({ id: p.user.id }, 'coins', Number(challenge.stake));
//     }
//     challenge.is_archived = true;
//     await this.challengeRepo.save(challenge);
//     return { message: 'Deleted' };
// }

// async invalidateChallenge(id: string) {
//     await this.challengeRepo.update(id, { status: 'completed', is_archived: true });
//     return { message: 'Invalidated' };
// }

// @Cron(CronExpression.EVERY_10_SECONDS)
// async checkExpiredChallenges() {
// const expired = await this.challengeRepo.find({
// where: { status: 'active', end_time: LessThan(new Date()), is_archived: false }
// });
// for (const c of expired) {
// await this.finalizeChallengeRewards(c.id);
// }
// }

// async kickParticipant(challengeId: string, participantId: string, userPayload: any) {
//     const challenge = await this.getChallengeById(challengeId);
//     if (!challenge) throw new NotFoundException('Challenge not found');
//     if (challenge.participants[0]?.user.id !== userPayload.userId) throw new ForbiddenException('Only host can kick.');
//     if (challenge.status !== 'pending') throw new BadRequestException('Cannot kick from live challenge');

//     const participant = challenge.participants.find(p => p.user.id === participantId);
//     if (!participant) throw new NotFoundException('Participant not found');

//     await this.userRepo.increment({ id: participantId }, 'coins', Number(challenge.stake));
//     await this.participantRepo.delete({ id: participant.id });

//     if (this.gateway.server) {
//       this.gateway.server.emit('user_kicked', { challengeId, userId: participantId });
//     }
//     return { message: 'Kicked' };
// }

// async completeChallenge(challengeId: string, userPayload: any, body?: any) {
// await this.finalizeChallengeRewards(challengeId);
// return { message: 'Finalized' };
// }

// async submitProof(challengeId: string, userPayload: any, body: any) {
// await this.challengeRepo.update(challengeId, { proof_url: body.proof_url });
// return { message: 'Submitted' };
// }

// async findMatch(query: any, userPayload: any) {
// const { stake, type, duration_minutes } = query;
// const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
// if (!user) throw new NotFoundException('User not found');
// const queueUser = { userId: user.id, level: user.level, stake: Number(stake), type };
// const match = queueMatch(queueUser);
// if (match) {
//   removeFromQueue(match.userId);
//   return this.createChallenge({ title: 'Battle Arena', stake: Number(stake), duration_minutes: duration_minutes || 30, type: 'group', status: 'active' }, userPayload);
// }
// addToQueue(queueUser);
// return { message: 'Searching...' };
// }
// }

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
  // --- ECONOMIC CONSTANTS ---
  private readonly PLATFORM_FEE_RATE = 0.20;
  private readonly LOSER_CONSOLATION_RATE = 0.10;
  private readonly SOLO_FAIL_REFUND_RATE = 0.30;
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
  // 🔥 CORE REWARD ENGINE
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

  private async processSoloRewards(challenge: Challenge, winners: Participant[], losers: Participant[], stake: number, duration: number) {
    for (const p of challenge.participants) {
      const user = await this.userRepo.findOne({ where: { id: p.user.id } });
      if (!user) continue;

      const isWinner = (Number(p.warnings) || 0) < 4;
      const canEarnCoins = await this.checkDailyRewardEligibility(user.id);

      if (isWinner) {
        const bonusMultiplier = Math.min((duration / 5) * 0.005, 0.50);
        const strikeTax = this.getStrikeTaxMultiplier(Number(p.warnings));
        const baseProfit = Math.max(Math.floor(stake * bonusMultiplier), 1);
        const netProfit = canEarnCoins ? Math.floor(baseProfit * strikeTax) : 0;

        user.coins = Number(user.coins) + stake + netProfit;
        user.wins = (Number(user.wins) || 0) + 1;
        user.streak = (Number(user.streak) || 0) + 1;
        user.xp = (Number(user.xp) || 0) + this.SOLO_BASE_XP + duration;
      } else {
        const refund = Math.floor(stake * this.SOLO_FAIL_REFUND_RATE);
        user.coins = Number(user.coins) + refund;
        user.losses = (Number(user.losses) || 0) + 1;
        user.streak = 0;
        user.xp = (Number(user.xp) || 0) + 5;
      }
      await this.saveUserProgress(user);
    }
  }

  private async processGroupRewards(challenge: Challenge, winners: Participant[], losers: Participant[], stake: number, duration: number) {
    const totalLoserStake = losers.length * stake;
    const platformFee = Math.floor(totalLoserStake * this.PLATFORM_FEE_RATE);
    const totalConsolation = Math.floor(totalLoserStake * this.LOSER_CONSOLATION_RATE);
    const netBountyPool = totalLoserStake - platformFee - totalConsolation;

    for (const p of losers) {
      const user = await this.userRepo.findOne({ where: { id: p.user.id } });
      if (!user) continue;
      const refund = Math.floor(stake * this.LOSER_CONSOLATION_RATE);
      user.coins = Number(user.coins) + refund;
      user.losses = (Number(user.losses) || 0) + 1;
      user.streak = 0;
      user.xp = (Number(user.xp) || 0) + 5;
      await this.saveUserProgress(user);
    }

    const sharePerWinner = winners.length > 0 ? Math.floor(netBountyPool / winners.length) : 0;
    for (const p of winners) {
      const user = await this.userRepo.findOne({ where: { id: p.user.id } });
      if (!user) continue;

      const canEarnCoins = await this.checkDailyRewardEligibility(user.id);
      const strikeTax = this.getStrikeTaxMultiplier(Number(p.warnings));
      const profit = canEarnCoins ? Math.floor(sharePerWinner * strikeTax) : 0;

      user.coins = Number(user.coins) + stake + profit;
      user.wins = (Number(user.wins) || 0) + 1;
      user.streak = (Number(user.streak) || 0) + 1;
      user.xp = (Number(user.xp) || 0) + this.GROUP_BASE_XP + duration;
      await this.saveUserProgress(user);
    }
  }

  private async saveUserProgress(user: User) {
    user.level = Math.floor((Number(user.xp) || 0) / 100) + 1;
    await this.userRepo.save(user);
    await this.assignBadges(user);
  }

  private async assignBadges(user: User) {
    const rules = [
      { name: 'First Win', cond: Number(user.wins) >= 1, desc: 'Earned your first victory!' },
      { name: 'Streak Master', cond: Number(user.streak) >= 5, desc: 'Unstoppable for 5 sessions!' },
      { name: 'Elite Focuser', cond: Number(user.level) >= 10, desc: 'Reached Level 10!' },
      { name: 'Rich Player', cond: Number(user.coins) >= 5000, desc: 'Amassed a fortune of 5,000 coins!' }
    ];

    for (const r of rules) {
      if (!r.cond) continue;
      let b = await this.badgeRepo.findOne({ where: { name: r.name } });
      if (!b) b = await this.badgeRepo.save(this.badgeRepo.create({ name: r.name, description: r.desc }));

      const exists = await this.userBadgeRepo.findOne({
        where: { user: { id: user.id }, badge: { id: b.id } }
      });

      if (!exists) {
        await this.userBadgeRepo.save(this.userBadgeRepo.create({ user, badge: b }));
        this.logger.log(`Awarded badge ${r.name} to user ${user.id}`);
      }
    }
  }

  private getStrikeTaxMultiplier(strikes: number): number {
    if (strikes === 0) return 1.0;
    if (strikes === 1) return 0.9;
    if (strikes === 2) return 0.7;
    if (strikes === 3) return 0.5;
    return 0;
  }

  private async checkDailyRewardEligibility(userId: string): Promise<boolean> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const count = await this.participantRepo.count({
      where: {
        user: { id: userId },
        challenge: { status: 'completed', created_at: Between(startOfDay, new Date()) }
      }
    });
    return count < this.DAILY_REWARD_LIMIT;
  }

  async incrementWarning(challengeId: string, userId: string) {
    const participant = await this.participantRepo.findOne({
      where: { challenge: { id: challengeId }, user: { id: userId } }
    });
    if (!participant) throw new NotFoundException('Participant not found');

    participant.warnings = (Number(participant.warnings) || 0) + 1;
    await this.participantRepo.save(participant);

    if (participant.warnings >= 4) {
      const challenge = await this.challengeRepo.findOne({ where: { id: challengeId } });
      if (challenge?.type === 'solo') {
        await this.finalizeChallengeRewards(challengeId);
      }
      return { status: 'failed', warnings: participant.warnings };
    }
    return { status: 'active', warnings: participant.warnings };
  }

  private async ensureNoActiveChallenge(userId: string) {
    const active = await this.participantRepo.findOne({
      where: {
        user: { id: userId },
        challenge: { status: In(['active', 'pending']), is_archived: false }
      },
      relations: ['challenge']
    });

    if (active) {
      const c = active.challenge;
      if (c.status === 'active' && c.end_time && new Date() > new Date(c.end_time)) {
        await this.finalizeChallengeRewards(c.id);
        return;
      }
      if (c.status === 'pending') {
        await this.challengeRepo.update(c.id, { is_archived: true });
        return;
      }
      throw new BadRequestException('Finish your current session first.');
    }
  }

  // ==========================================
  // 🔥 CHALLENGE CRUD & API
  // ==========================================

  async createChallenge(body: any, userPayload: any) {
    await this.ensureNoActiveChallenge(userPayload.userId);
    const { title, stake, duration_minutes, type, status } = body;
    const numStake = Number(stake);
    const numDuration = Number(duration_minutes);

    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    if (!user) throw new NotFoundException('User not found');

    if (numStake > this.HIGH_STAKE_THRESHOLD && user.level < this.HIGH_STAKE_MIN_LEVEL) {
      throw new BadRequestException(`High Stake arenas require Level ${this.HIGH_STAKE_MIN_LEVEL}.`);
    }

    if (numStake > numDuration * this.MAX_STAKE_PER_MINUTE) {
      throw new BadRequestException(`Max stake for ${numDuration} mins is ${numDuration * this.MAX_STAKE_PER_MINUTE} coins.`);
    }

    if (Number(user.coins) < numStake) throw new BadRequestException('Insufficient balance.');

    await this.userRepo.decrement({ id: user.id }, 'coins', numStake);

    const challenge = this.challengeRepo.create({
      title: title || 'Focus Session',
      stake: numStake,
      duration_minutes: numDuration,
      type: type || 'solo',
      status: status || 'pending',
      is_archived: false
    });

    const savedChallenge = await this.challengeRepo.save(challenge);
    await this.participantRepo.save(this.participantRepo.create({ user, challenge: savedChallenge, warnings: 0 }));
    return savedChallenge;
  }

  async joinChallenge(challengeId: string, userPayload: any) {
    await this.ensureNoActiveChallenge(userPayload.userId);
    const challenge = await this.challengeRepo.findOne({ where: { id: challengeId }, relations: ['participants'] });
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });

    if (!challenge || !user) throw new NotFoundException('Data not found');
    if (Number(user.coins) < Number(challenge.stake)) throw new BadRequestException('Insufficient coins.');
    if (challenge.status !== 'pending') throw new BadRequestException('Challenge already started.');

    await this.userRepo.decrement({ id: user.id }, 'coins', Number(challenge.stake));
    await this.participantRepo.save(this.participantRepo.create({ user, challenge, warnings: 0 }));

    if (this.gateway.server) {
      this.gateway.server.emit('user_joined', { challengeId, userId: user.id });
    }
    return { message: 'Joined' };
  }

  async startChallenge(id: string, userPayload?: any) {
    const c = await this.challengeRepo.findOne({
      where: { id },
      relations: ['participants', 'participants.user']
    });

    if (!c) throw new NotFoundException('Challenge not found');

    c.participants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const hostId = c.participants[0]?.user.id;

    if (userPayload && hostId !== userPayload.userId) {
      throw new ForbiddenException('Only the Arena Host can launch this battle.');
    }

    if (c.type === 'group' && c.participants.length < 2) {
      throw new BadRequestException('Wait for at least one player to join before launching.');
    }

    c.status = 'active';
    const now = new Date();
    c.start_time = now;
    c.end_time = new Date(now.getTime() + Number(c.duration_minutes) * 60000);
    const saved = await this.challengeRepo.save(c);

    if (this.gateway.server) {
      this.gateway.server.emit('challenge_started', { challengeId: id });
    }
    return saved;
  }

  async invalidateChallenge(id: string) {
    await this.challengeRepo.update(id, { status: 'completed', is_archived: true });
    return { message: 'Invalidated' };
  }

  // RE-ADDED MISSING GETALL TO FIX CONTROLLER ERROR
  async getAll(userPayload?: any) { 
    return await this.getAllChallenges(userPayload); 
  }

  async getAllChallenges(userPayload?: any) {
    const userId = userPayload?.userId;
    const all = await this.challengeRepo.find({
      where: { is_archived: false },
      order: { created_at: 'DESC' },
      relations: ['participants', 'participants.user'],
    });

    all.forEach(c => {
      if (c.participants) {
        c.participants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      }
    });

    if (!userId) return all;

    return all.filter(c => {
      if (c.type === 'group') return true;
      if (c.type === 'solo') return c.participants.some(p => p.user.id === userId);
      return false;
    });
  }

  async getChallengeById(id: string) {
    const challenge = await this.challengeRepo.findOne({
      where: { id },
      relations: ['participants', 'participants.user']
    });
    if (challenge && challenge.participants) {
      challenge.participants.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    return challenge;
  }

  async deleteChallenge(id: string, userId: string) {
    const challenge = await this.getChallengeById(id);
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.participants[0]?.user.id !== userId) throw new ForbiddenException('Only host can cancel.');
    if (challenge.status !== 'pending') throw new BadRequestException('Cannot delete live challenge.');

    for (const p of challenge.participants) {
      await this.userRepo.increment({ id: p.user.id }, 'coins', Number(challenge.stake));
    }
    challenge.is_archived = true;
    await this.challengeRepo.save(challenge);
    return { message: 'Deleted' };
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async checkExpiredChallenges() {
    const expired = await this.challengeRepo.find({
      where: { status: 'active', end_time: LessThan(new Date()), is_archived: false }
    });
    for (const c of expired) {
      await this.finalizeChallengeRewards(c.id);
    }
  }

  async kickParticipant(challengeId: string, participantId: string, userPayload: any) {
    const challenge = await this.getChallengeById(challengeId);
    if (!challenge) throw new NotFoundException('Challenge not found');
    if (challenge.participants[0]?.user.id !== userPayload.userId) throw new ForbiddenException('Only the Arena Host can remove players.');
    if (challenge.status !== 'pending') throw new BadRequestException('Cannot kick from live challenge');

    const participant = challenge.participants.find(p => p.user.id === participantId);
    if (!participant) throw new NotFoundException('Participant not found');

    await this.userRepo.increment({ id: participantId }, 'coins', Number(challenge.stake));
    await this.participantRepo.delete({ id: participant.id });

    if (this.gateway.server) {
      this.gateway.server.emit('user_kicked', { challengeId, userId: participantId });
    }
    return { message: 'Kicked' };
  }

  // ADDED BODY PARAMETER BACK TO FIX CONTROLLER ERROR
  async completeChallenge(challengeId: string, userPayload: any, body?: any) {
    await this.finalizeChallengeRewards(challengeId);
    return { message: 'Finalized' };
  }

  async submitProof(challengeId: string, userPayload: any, body: any) {
    await this.challengeRepo.update(challengeId, { proof_url: body.proof_url });
    return { message: 'Submitted' };
  }

  async findMatch(query: any, userPayload: any) {
    const { stake, type, duration_minutes } = query;
    const user = await this.userRepo.findOne({ where: { id: userPayload.userId } });
    if (!user) throw new NotFoundException('User not found');
    const queueUser = { userId: user.id, level: user.level, stake: Number(stake), type };
    const match = queueMatch(queueUser);
    if (match) {
      removeFromQueue(match.userId);
      return this.createChallenge({ title: 'Battle Arena', stake: Number(stake), duration_minutes: duration_minutes || 30, type: 'group', status: 'active' }, userPayload);
    }
    addToQueue(queueUser);
    return { message: 'Searching...' };
  }
}