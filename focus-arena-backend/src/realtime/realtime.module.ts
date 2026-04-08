import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RealtimeGateway } from './realtime.gateway';
import { Challenge } from '../challenges/challenge.entity';
import { Participant } from '../participants/participant.entity';
import { User } from '../users/user.entity'; // ✅ ADD THIS

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Challenge,
      Participant,
      User, // ✅ ADD THIS (VERY IMPORTANT)
    ]),
  ],
  providers: [RealtimeGateway],
  exports: [RealtimeGateway],
})
export class RealtimeModule {}