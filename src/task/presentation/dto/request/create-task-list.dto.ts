import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTaskListDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;
}
