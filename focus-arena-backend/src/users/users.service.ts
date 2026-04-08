import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Badge } from '../badges/badge.entity';
import { UserBadge } from '../badges/user-badge.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Badge) private badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge) private userBadgeRepo: Repository<UserBadge>,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['participants', 'participants.challenge', 'badges', 'badges.badge'],
    });

    if (!user) throw new NotFoundException('User not found');

    // 🔥 SYNC ALL 15 BADGES
    await this.syncAllBadges(user);

    if (user.participants) {
      user.participants = user.participants.filter(p => 
        p.challenge && !p.challenge.is_archived && 
        (p.challenge.status === 'active' || p.challenge.status === 'pending')
      );
    }
    return user;
  }

// focus-arena-backend/src/users/users.service.ts

private async syncAllBadges(user: User) {
  const hour = new Date().getHours();
  const day = new Date().getDay();

  const rules = [
    { name: 'First Win', cond: Number(user.wins) >= 1, desc: 'First victory!' },
    { name: 'Streak Master', cond: Number(user.streak) >= 5, desc: '5 win streak!' },
    { name: 'Double Digit', cond: Number(user.streak) >= 10, desc: '10 win streak!' },
    { name: 'God Mode', cond: Number(user.streak) >= 25, desc: 'Legendary 25 streak!' },
    { name: 'Elite Focuser', cond: Number(user.level) >= 10, desc: 'Reached Level 10!' },
    { name: 'Pro Challenger', cond: Number(user.wins) >= 25, desc: '25 total wins!' },
    { name: 'Master of Focus', cond: Number(user.wins) >= 50, desc: '50 total wins!' },
    { name: 'Centurion', cond: Number(user.wins) >= 100, desc: '100 total wins!' },
    { name: 'Rich Player', cond: Number(user.coins) >= 5000, desc: '5,000 coins milestone!' },
    { name: 'Zen Master', cond: Number(user.wins) >= 1, desc: 'Perfect focus unlocked!' },
    { name: 'High Roller', cond: Number(user.wins) >= 1, desc: 'High stakes player!' },
    { name: 'Marathoner', cond: Number(user.wins) >= 1, desc: 'Endurance unlocked!' },
    { name: 'Early Bird', cond: hour >= 4 && hour <= 8, desc: 'Woke up early!' },
    { name: 'Night Owl', cond: hour >= 23 || hour <= 3, desc: 'Late night focus!' },
    { name: 'Weekend Warrior', cond: day === 0 || day === 6, desc: 'No days off!' }
  ];

  if (!user.badges) user.badges = [];

  for (const r of rules) {
    if (!r.cond) continue;

    // Check if user ALREADY has this badge in their loaded list
    const alreadyHas = user.badges.some(ub => ub.badge?.name === r.name);
    if (alreadyHas) continue;

    // Load or create badge definition
    let b = await this.badgeRepo.findOne({ where: { name: r.name } });
    if (!b) b = await this.badgeRepo.save(this.badgeRepo.create({ name: r.name, description: r.desc }));

    // Final DB check to be 100% sure
    const dbCheck = await this.userBadgeRepo.findOne({
      where: { user: { id: user.id }, badge: { id: b.id } }
    });

    if (!dbCheck) {
      const newBadge = await this.userBadgeRepo.save(this.userBadgeRepo.create({ user, badge: b }));
      user.badges.push(newBadge);
    }
  }
}
  // ... keep getLeaderboard and withdrawCoins same
  async getLeaderboard() {
    const users = await this.userRepo.find({ order: { coins: 'DESC' }, take: 10 });
    return users.map((u, i) => ({ rank: i + 1, name: u.name, coins: u.coins, xp: u.xp, wins: u.wins, losses: u.losses, streak: u.streak }));
  }

  async withdrawCoins(userId: string, amount: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || Number(user.coins) < amount + 50) throw new BadRequestException('Invalid withdrawal');
    await this.userRepo.decrement({ id: user.id }, 'coins', amount + 50);
    return { message: 'Success' };
  }
}