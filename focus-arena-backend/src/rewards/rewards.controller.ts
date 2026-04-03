import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('rewards')
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('daily')
  daily(@Request() req) {
    return this.rewardsService.dailyReward(req.user.userId);
  }
}