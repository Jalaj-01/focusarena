import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [RewardsService],
  controllers: [RewardsController],
})
export class RewardsModule {}