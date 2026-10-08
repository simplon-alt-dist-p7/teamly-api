import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTaskListDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  readonly name: string;
}
