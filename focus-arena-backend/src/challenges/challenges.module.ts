import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Challenge } from './challenge.entity';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { User } from '../users/user.entity';
import { Participant } from '../participants/participant.entity';
import { Badge } from '../badges/badge.entity';
import { UserBadge } from '../badges/user-badge.entity';
import { RealtimeModule } from '../realtime/realtime.module';
import { AdminController } from '../admin/admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Challenge,
      User,
      Participant,
      Badge,
      UserBadge,
    ]),
    // Use forwardRef to allow Challenges and Realtime to talk to each other
    forwardRef(() => RealtimeModule),
  ],
  controllers: [ChallengesController, AdminController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}