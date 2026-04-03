import { IsInt, IsString, Min } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsInt()
  @Min(1)
  stake: number;

  @IsInt()
  duration_minutes: number;

  @IsString()
  type: 'solo' | 'group';
}