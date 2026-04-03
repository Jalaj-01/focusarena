import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  description: string;
}