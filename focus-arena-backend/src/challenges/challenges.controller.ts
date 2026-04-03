import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
  Get,
} from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.challengesService.createChallenge(body, req.user);
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  join(@Param('id') id: string, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.challengesService.joinChallenge(id, req.user);
  }

  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  complete(@Param('id') id: string, @Body() body, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.challengesService.completeChallenge(id, req.user, body);
  }
  @Post(':id/proof')
  @UseGuards(JwtAuthGuard)
  submitProof(@Param('id') id: string, @Body() body, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.challengesService.submitProof(id, req.user, body);
}
  @Get('match')
  @UseGuards(JwtAuthGuard)
  findMatch(@Query() query, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.challengesService.findMatch(query, req.user);
  }
}
