import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getLeaderboard() {
    return this.userRepo.find({
      order: { xp: 'DESC' },
      take: 10,
    });
  }
}