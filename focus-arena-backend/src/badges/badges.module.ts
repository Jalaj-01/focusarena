import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge, UserBadge])],
  exports: [TypeOrmModule],
})
export class BadgesModule {}
