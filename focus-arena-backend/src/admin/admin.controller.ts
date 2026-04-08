import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { ChallengesService } from '../challenges/challenges.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private challengeService: ChallengesService) {}

  // 🔴 View all challenges
  @Get('challenges')
  getAll() {
    return this.challengeService.getAllChallenges();
  }

  // 🔴 Mark challenge invalid
  @Get('invalidate/:id')
  invalidate(@Param('id') id: string) {
    return this.challengeService.invalidateChallenge(id);
  }
}