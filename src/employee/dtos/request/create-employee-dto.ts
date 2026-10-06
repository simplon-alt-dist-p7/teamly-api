import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateEmployeeRequest {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  readonly password: string;

  @IsNotEmpty()
  readonly firstName: string;

  @IsNotEmpty()
  readonly lastName: string;
}
