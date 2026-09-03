import { IsDateString, IsNotEmpty } from 'class-validator';

export class DuplicateWeekDto {
  @IsNotEmpty()
  @IsDateString()
  readonly referenceDate: string;
}
