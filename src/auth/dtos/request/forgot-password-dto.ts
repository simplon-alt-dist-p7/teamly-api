import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordRequest {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;
}
