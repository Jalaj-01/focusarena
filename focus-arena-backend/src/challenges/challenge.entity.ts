import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: 'solo' | 'group';

  @Column('int')
  stake: number;

  @Column('int')
  duration_minutes: number;

  @Column({ default: 'pending' })
  status: 'pending' | 'active' | 'completed';

  @Column({ default: false })
  is_archived: boolean;

  // ⏱ TIMER SYSTEM
  @Column({ type: 'timestamp', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  // 📸 PROOF SYSTEM
  @Column({ nullable: true })
  proof_url: string;

  // 🛡 ANTI-CHEAT
  @Column({ nullable: true })
  completed_by: string;

  @CreateDateColumn()
  created_at: Date;

}
