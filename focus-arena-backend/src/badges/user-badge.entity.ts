import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.badges)
  user: User;

  @ManyToOne(() => Badge, (badge) => badge.user_badges)
  badge: Badge;

  @CreateDateColumn()
  earned_at: Date;
}