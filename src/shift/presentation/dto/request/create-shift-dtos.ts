import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateShiftDto {
  @IsNotEmpty()
  @IsDateString()
  readonly startTime: string;

  @IsNotEmpty()
  @IsDateString()
  readonly endTime: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  readonly note?: string;
}
