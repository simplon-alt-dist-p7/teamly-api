import { IsDateString, IsNotEmpty } from 'class-validator';

export class UpdateShiftDto {
  @IsNotEmpty()
  @IsDateString()
  readonly startTime: string;

  @IsNotEmpty()
  @IsDateString()
  readonly endTime: string;
}
