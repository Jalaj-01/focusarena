import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChallengesModule } from './challenges/challenges.module';
import { BadgesModule } from './badges/badges.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { RewardsModule } from './rewards/rewards.module';
import { RealtimeModule } from './realtime/realtime.module';
import { FriendsModule } from './friends/friends.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuthModule,

    ChallengesModule,

    BadgesModule,

    LeaderboardModule,

    RewardsModule,

    RealtimeModule,

    FriendsModule,

    UploadsModule, // 👈 only this module needed here
  ],
})
export class AppModule {}
