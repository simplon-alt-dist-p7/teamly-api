import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectLeaveRequestDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly managerNote?: string;
}
