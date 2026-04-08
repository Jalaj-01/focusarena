import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Participant } from '../participants/participant.entity';
import { Badge } from '../badges/badge.entity'; // Added
import { UserBadge } from '../badges/user-badge.entity'; // Added

@Module({
  imports: [TypeOrmModule.forFeature([User, Participant, Badge, UserBadge])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // Export service for challenges
})
export class UsersModule {}