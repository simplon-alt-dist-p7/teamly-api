import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddTaskDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  readonly label: string;
}
