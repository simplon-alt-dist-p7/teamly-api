import { IsDateString, IsNotEmpty } from 'class-validator';

// Jours au format "2026-11-12".
export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsDateString()
  readonly startDate: string;

  @IsNotEmpty()
  @IsDateString()
  readonly endDate: string;
}
