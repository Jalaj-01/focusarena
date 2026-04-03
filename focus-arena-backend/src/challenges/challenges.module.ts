import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './challenge.entity';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { User } from '../users/user.entity';
import { Participant } from '../participants/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Challenge, User, Participant])],
  controllers: [ChallengesController],
  providers: [ChallengesService],
})
export class ChallengesModule {}
