import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Participant } from '../participants/participant.entity';
import { UserBadge } from '../badges/user-badge.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ default: 100 })
  coins: number;

  @Column({ default: 0 })
  xp: number;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  streak: number;

  @CreateDateColumn()
  created_at: Date;

  @Column({ default: 0 })
  wins: number;

  @Column({ default: 0 })
  losses: number;

  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ nullable: true })
  proof_url: string;

  @Column({ nullable: true })
  completed_by: string;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  
  @OneToMany(() => Participant, (participant) => participant.user)
  participants: Participant[];

   @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  badges: UserBadge[];
}