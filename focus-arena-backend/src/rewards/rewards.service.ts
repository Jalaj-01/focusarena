import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RewardsService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async dailyReward(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) return;

    user.coins += 20;
    user.streak += 1;

    await this.userRepo.save(user);

    return {
      message: 'Daily reward claimed',
      coins: user.coins,
      streak: user.streak,
    };
  }
}