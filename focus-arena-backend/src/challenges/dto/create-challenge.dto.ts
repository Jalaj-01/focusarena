import { IsInt, IsString, Min } from 'class-validator';

export class CreateChallengeDto {
  @IsString()
  title: string | undefined;

  @IsInt()
  @Min(1)
  stake: number | undefined;

  @IsInt()
  duration_minutes: number | undefined;

  @IsString()
  type: 'solo' | 'group' | undefined;
}
