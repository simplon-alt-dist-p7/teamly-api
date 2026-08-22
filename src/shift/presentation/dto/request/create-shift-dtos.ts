import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateShiftDto {
  @IsNotEmpty()
  @IsDateString()
  readonly startTime: string;

  @IsNotEmpty()
  @IsDateString()
  readonly endTime: string;
}
