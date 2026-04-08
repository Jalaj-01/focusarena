// import {
//   Controller,
//   Post,
//   Body,
//   UseGuards,
//   Request,
//   Param,
//   Query,
//   Get,
//   Patch,
//   Delete,
// } from '@nestjs/common';
// import { ChallengesService } from './challenges.service';
// import { JwtAuthGuard } from '../auth/jwt.guard';

// @Controller('challenges')
// export class ChallengesController {
//   constructor(private challengesService: ChallengesService) {}

//   @UseGuards(JwtAuthGuard)
//   @Post()
//   create(@Body() body, @Request() req) {
//     return this.challengesService.createChallenge(body, req.user);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Post(':id/join')
//   join(@Param('id') id: string, @Request() req) {
//     return this.challengesService.joinChallenge(id, req.user);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Patch(':id/complete')
//   complete(@Param('id') id: string, @Body() body, @Request() req) {
//     return this.challengesService.completeChallenge(id, req.user, body);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Post(':id/proof')
//   submitProof(@Param('id') id: string, @Body() body, @Request() req) {
//     return this.challengesService.submitProof(id, req.user, body);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Patch(':id/warning')
//   addWarning(@Param('id') id: string, @Request() req) {
//     return this.challengesService.incrementWarning(id, req.user.userId);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get('match')
//   findMatch(@Query() query, @Request() req) {
//     return this.challengesService.findMatch(query, req.user);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get(':id')
//   getChallenge(@Param('id') id: string) {
//     return this.challengesService.getChallengeById(id);
//   }

//   @Get()
//   findAll() {
//     return this.challengesService.getAll();
//   }

//   @Patch(':id/start')
//   start(@Param('id') id: string) {
//     return this.challengesService.startChallenge(id);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Delete(':id')
//   delete(@Param('id') id: string, @Request() req) {
//     return this.challengesService.deleteChallenge(id, req.user.userId);
//   }
// }

import { Controller, Post, Body, UseGuards, Request, Param, Query, Get, Patch, Delete } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('challenges')
export class ChallengesController {
  constructor(private challengesService: ChallengesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body, @Request() req) {
    return this.challengesService.createChallenge(body, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  join(@Param('id') id: string, @Request() req) {
    return this.challengesService.joinChallenge(id, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete')
  complete(@Param('id') id: string, @Body() body, @Request() req) {
    return this.challengesService.completeChallenge(id, req.user, body);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/warning')
  addWarning(@Param('id') id: string, @Request() req) {
    return this.challengesService.incrementWarning(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('match')
  findMatch(@Query() query, @Request() req) {
    return this.challengesService.findMatch(query, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getChallenge(@Param('id') id: string) {
    return this.challengesService.getChallengeById(id);
  }

  @Get()
  findAll() {
    return this.challengesService.getAll();
  }

  @Patch(':id/start')
  start(@Param('id') id: string) {
    return this.challengesService.startChallenge(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.challengesService.deleteChallenge(id, req.user.userId);
  }
}