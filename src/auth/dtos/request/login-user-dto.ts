import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class LoginUserRequest {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MaxLength(255)
  readonly password: string;
}
