import { IsDateString, IsOptional } from 'class-validator';

export class GetMyShiftsDto {
  @IsOptional()
  @IsDateString()
  readonly startDate?: string;
}
