import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordRequest {
  @IsNotEmpty()
  readonly token: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  readonly password: string;
}
