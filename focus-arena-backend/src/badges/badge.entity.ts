import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { UserBadge } from './user-badge.entity';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @OneToMany(() => UserBadge, (userBadge) => userBadge.badge)
  user_badges: UserBadge[];
}