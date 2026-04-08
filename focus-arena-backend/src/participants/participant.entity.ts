import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn, // Added this import
} from 'typeorm';
import { User } from '../users/user.entity';
import { Challenge } from '../challenges/challenge.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Challenge, (challenge) => challenge.participants)
  challenge: Challenge;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 100 })
  activityScore: number;

  @Column({ default: 0 })
  totalActiveTime: number; // in seconds

  @Column({ default: 0 })
  totalInactiveTime: number; // in seconds

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ default: 0 })
  warnings: number;

  @Column({ default: false })
  disqualified: boolean;

  @Column({ default: 0 })
  disconnectCount: number;

  @CreateDateColumn()
  created_at: Date;
}