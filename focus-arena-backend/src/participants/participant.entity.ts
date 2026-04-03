import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from '../users/user.entity';
import { Challenge } from '../challenges/challenge.entity';

@Entity()
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Challenge)
  challenge: Challenge;

  @Column({ default: false })
  completed: boolean;

  @Column({ default: 0 })
  score: number;
}
