import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddTaskDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  readonly label: string;

  @IsNotEmpty()
  @IsBoolean()
  readonly requiresValidation: boolean;
}
