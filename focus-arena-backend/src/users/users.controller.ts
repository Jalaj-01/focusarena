import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 🔐 USER PROFILE
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return {
      message: 'Protected route accessed',
      user: req.user,
    };
  }

  // 🏆 LEADERBOARD (PUBLIC)
  @Get('leaderboard')
  async getLeaderboard() {
    return this.usersService.getLeaderboard();
  }
}