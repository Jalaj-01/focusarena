import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardController } from './leaderboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [LeaderboardService],
  controllers: [LeaderboardController],
})
export class LeaderboardModule {}