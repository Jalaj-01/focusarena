import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Challenge } from './challenge.entity';
import { User } from '../users/user.entity';
import { Participant } from '../participants/participant.entity';
import { Badge } from '../badges/badge.entity';
import { UserBadge } from '../badges/user-badge.entity';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class ChallengesService {
  constructor(
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,

    @InjectRepository(Badge)
    private badgeRepo: Repository<Badge>,

    @InjectRepository(UserBadge)
    private userBadgeRepo: Repository<UserBadge>,

    private gateway: RealtimeGateway, // 🔥 NEW
  ) {}

  private updateLevel(user: User) {
    user.level = Math.floor(user.xp / 100) + 1;
  }

  async createChallenge(body: any, userPayload: any) {
    const title = body.title;
    const stake = parseInt(body.stake);
    const duration_minutes = parseInt(body.duration_minutes);
    const type = body.type;

    if (!stake || isNaN(stake) || stake <= 0) {
      throw new BadRequestException('Stake must be valid');
    }

    const user = await this.userRepo.findOne({
      where: { id: userPayload.userId },
    });

    if (!user) throw new BadRequestException('User not found');

    if (user.coins < stake) {
      throw new BadRequestException('Insufficient coins');
    }

    user.coins -= stake;
    await this.userRepo.save(user);

    const now = new Date();
    const end = new Date(now.getTime() + duration_minutes * 60000);

    const challenge = this.challengeRepo.create({
      title,
      stake,
      duration_minutes,
      type,
      status: 'active',
      start_time: now,
      end_time: end,
    });

    await this.challengeRepo.save(challenge);

    // 🔥 REALTIME
    this.gateway.emitToRoom(challenge.id, 'challenge_created', challenge);

    return {
      message: 'Challenge created',
      challenge,
    };
  }

  async joinChallenge(challengeId: string, userPayload: any) {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) throw new BadRequestException('Challenge not found');

    if (challenge.status === 'completed') {
      throw new BadRequestException('Challenge already completed');
    }

    const user = await this.userRepo.findOne({
      where: { id: userPayload.userId },
    });

    if (!user) throw new BadRequestException('User not found');

    const stake = parseInt(challenge.stake as any);

    const existing = await this.participantRepo.findOne({
      where: {
        user: { id: user.id },
        challenge: { id: challengeId },
      },
      relations: ['user', 'challenge'],
    });

    if (existing) {
      throw new BadRequestException('Already joined');
    }

    if (user.coins < stake) {
      throw new BadRequestException('Insufficient coins');
    }

    user.coins -= stake;
    await this.userRepo.save(user);

    const participant = this.participantRepo.create({
      user,
      challenge,
    });

    await this.participantRepo.save(participant);

    // 🔥 REALTIME
    this.gateway.emitToRoom(challengeId, 'user_joined', {
      userId: user.id,
    });

    return { message: 'Joined successfully' };
  }

  async submitProof(challengeId: string, userPayload: any, body: any) {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) throw new BadRequestException('Challenge not found');

    const user = await this.userRepo.findOne({
      where: { id: userPayload.userId },
    });

    if (!user) throw new BadRequestException('User not found');

    const participant = await this.participantRepo.findOne({
      where: {
        user: { id: user.id },
        challenge: { id: challengeId },
      },
      relations: ['user', 'challenge'],
    });

    if (!participant && challenge.type === 'group') {
      throw new BadRequestException('Not a participant');
    }

    challenge.proof_url = body.proof_url;
    await this.challengeRepo.save(challenge);

    // 🔥 REALTIME
    this.gateway.emitToRoom(challengeId, 'proof_submitted', {
      userId: user.id,
    });

    return { message: 'Proof submitted' };
  }

  async completeChallenge(challengeId: string, userPayload: any, body: any) {
    const challenge = await this.challengeRepo.findOne({
      where: { id: challengeId },
    });

    if (!challenge) throw new BadRequestException('Challenge not found');

    if (challenge.status === 'completed') {
      throw new BadRequestException('Already completed');
    }

    if (new Date() < challenge.end_time) {
      throw new BadRequestException('Challenge still ongoing');
    }

    if (!challenge.proof_url) {
      throw new BadRequestException('Submit proof first');
    }

    if (challenge.completed_by) {
      throw new BadRequestException('Already completed');
    }

    const user = await this.userRepo.findOne({
      where: { id: userPayload.userId },
    });

    if (!user) throw new BadRequestException('User not found');

    const stake = parseInt(challenge.stake as any);
    const status = body?.status;

    if (!['success', 'fail'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    if (challenge.type === 'solo') {
      let reward = 0;

      if (status === 'success') {
        reward = stake + Math.floor(stake * 0.5);
        user.wins += 1;
        user.xp += 50;
        user.streak += 1;
      } else {
        reward = Math.floor(stake * 0.5);
        user.losses += 1;
        user.streak = 0;
      }

      user.coins += reward;
      this.updateLevel(user);
      await this.assignBadges(user);
      await this.userRepo.save(user);

      challenge.status = 'completed';
      challenge.completed_by = user.id;
      challenge.is_archived = true; // 🔥 NEW
      await this.challengeRepo.save(challenge);

      this.gateway.emitToRoom(challengeId, 'challenge_completed', {
        winner: user.id,
      });

      return { message: `Solo ${status}`, reward };
    }

    const participants = await this.participantRepo.find({
      relations: ['user', 'challenge'],
    });

    const filtered = participants.filter(
      (p) => p.challenge.id === challengeId,
    );

    if (filtered.length < 2) {
      throw new BadRequestException('Need 2 users');
    }

    const totalPool = stake * filtered.length;
    const commission = Math.floor(totalPool * 0.1);
    const reward = totalPool - commission;

    if (status === 'success') {
      user.coins += reward;
      user.wins += 1;
      user.xp += 100;
      user.streak += 1;
    } else {
      user.losses += 1;
      user.streak = 0;
    }

    this.updateLevel(user);
    await this.assignBadges(user);
    await this.userRepo.save(user);

    challenge.status = 'completed';
    challenge.completed_by = user.id;
    challenge.is_archived = true; // 🔥 NEW
    await this.challengeRepo.save(challenge);

    this.gateway.emitToRoom(challengeId, 'challenge_completed', {
      winner: user.id,
    });

    return { message: `Group ${status}` };
  }

  private async assignBadges(user: User) {
    const badgeRules = [
      { name: 'First Win', condition: user.wins === 1 },
      { name: 'Streak Master', condition: user.streak === 5 },
      { name: 'Rich Player', condition: user.coins >= 500 },
    ];

    for (const rule of badgeRules) {
      if (!rule.condition) continue;

      let badge = await this.badgeRepo.findOne({
        where: { name: rule.name },
      });

      if (!badge) {
        badge = this.badgeRepo.create({
          name: rule.name,
          description: `${rule.name} achieved`,
        });
        await this.badgeRepo.save(badge);
      }

      const exists = await this.userBadgeRepo.findOne({
        where: {
          user: { id: user.id },
          badge: { id: badge.id },
        },
        relations: ['user', 'badge'],
      });

      if (!exists) {
        const userBadge = this.userBadgeRepo.create({
          user,
          badge,
        });
        await this.userBadgeRepo.save(userBadge);
      }
    }
  }

  async findMatch(query: any, userPayload: any) {
    const { stake, type, duration_minutes } = query;

    const challenge = await this.challengeRepo.findOne({
      where: {
        stake: Number(stake),
        type,
        status: 'active',
      },
      order: {
        created_at: 'ASC',
      },
    });

    if (!challenge) {
      return this.createChallenge(
        {
          title: 'Auto Match Challenge',
          stake,
          duration_minutes: duration_minutes || 30,
          type,
        },
        userPayload,
      );
    }

    return {
      message: 'Match found',
      challenge,
    };
  }
}