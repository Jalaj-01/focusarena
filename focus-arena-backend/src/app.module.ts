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
// import { AdminController } from './admin/admin.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      // 🔥 UPDATED: Support for single Connection URL (Production) 
      // or individual variables (Local Development)
      url: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true, // Keep true for now to auto-create tables on Neon
      
      // 🔥 SSL is REQUIRED for Neon and Render Database connections
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
      extra: process.env.DATABASE_URL ? {
        ssl: {
          rejectUnauthorized: false,
        },
      } : {},
    }),

    AuthModule,

    ChallengesModule,

    BadgesModule,

    LeaderboardModule,

    RewardsModule,

    RealtimeModule,

    FriendsModule,

    UploadsModule,
  ],
  // controllers: [AdminController],
})
export class AppModule {}