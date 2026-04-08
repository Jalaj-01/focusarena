// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from './user.entity';

// @Injectable()
// export class UsersService {
//   private readonly COIN_TO_USD_RATIO = 100; // 100 coins = $1
//   private readonly MIN_WITHDRAW_USD = 20; 
//   private readonly WITHDRAW_BURN_FEE = 50; // 50 coins burned per withdrawal

//   constructor(
//     @InjectRepository(User)
//     private userRepo: Repository<User>,
//   ) {}

//   async getLeaderboard() {
//     const users = await this.userRepo.find({
//       order: { coins: 'DESC' },
//       take: 10,
//     });

//     return users.map((u, index) => ({
//       rank: index + 1,
//       name: u.name,
//       coins: u.coins,
//       xp: u.xp,
//       wins: u.wins,
//       losses: u.losses,
//       streak: u.streak,
//     }));
//   }

//   async getProfile(userId: string) {
//     const user = await this.userRepo.findOne({
//       where: { id: userId },
//       relations: ['participants', 'participants.challenge'],
//     });

//     if (user && user.participants) {
//       // 🔥 FIXED: Filter participants list before sending to frontend.
//       // This removes "Ghost" buttons by only showing challenges that are 
//       // actually Live (Active/Pending) and NOT archived.
//       user.participants = user.participants.filter(p => 
//         p.challenge && 
//         !p.challenge.is_archived && 
//         (p.challenge.status === 'active' || p.challenge.status === 'pending')
//       );
//     }

//     return user;
//   }

//   async withdrawCoins(userId: string, amountInCoins: number) {
//     const user = await this.userRepo.findOne({ where: { id: userId } });
//     if (!user) throw new NotFoundException('User not found');

//     const amountInUsd = amountInCoins / this.COIN_TO_USD_RATIO;
    
//     if (amountInUsd < this.MIN_WITHDRAW_USD) {
//         throw new BadRequestException(`Minimum withdrawal is $${this.MIN_WITHDRAW_USD} (${this.MIN_WITHDRAW_USD * this.COIN_TO_USD_RATIO} coins).`);
//     }

//     if (Number(user.coins) < amountInCoins + this.WITHDRAW_BURN_FEE) {
//         throw new BadRequestException('Insufficient balance to cover withdrawal and burn fee.');
//     }

//     await this.userRepo.decrement({ id: user.id }, 'coins', amountInCoins + this.WITHDRAW_BURN_FEE);

//     return { 
//         message: 'Withdrawal initiated', 
//         withdrawn: amountInCoins, 
//         burned: this.WITHDRAW_BURN_FEE 
//     };
//   }
// }

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

    for (const r of rules) {
      if (!r.cond) continue;

      let b = await this.badgeRepo.findOne({ where: { name: r.name } });
      if (!b) b = await this.badgeRepo.save(this.badgeRepo.create({ name: r.name, description: r.desc }));

      // 🔥 FIXED DUPLICATE CHECK: 
      // We look at the database directly to see if this user-badge link exists
      const exists = await this.userBadgeRepo.findOne({
        where: { user: { id: user.id }, badge: { id: b.id } }
      });

      if (!exists) {
        const newBadge = await this.userBadgeRepo.save(this.userBadgeRepo.create({ user, badge: b }));
        if (!user.badges) user.badges = [];
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