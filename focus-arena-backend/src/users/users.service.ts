import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getLeaderboard() {
    const users = await this.userRepo.find({
      order: {
        coins: 'DESC',
      },
      take: 10,
    });

    return users.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      coins: u.coins,
      xp: u.xp,
      wins: u.wins,
      losses: u.losses,
      streak: u.streak,
    }));
  }

  // ✅ FIXED (moved outside)
  async getProfile(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId },
    });
}
}