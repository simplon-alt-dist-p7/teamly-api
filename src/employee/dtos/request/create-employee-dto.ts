import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateEmployeeRequest {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MaxLength(255)
  readonly password: string;

  @IsNotEmpty()
  readonly firstName: string;

  @IsNotEmpty()
  readonly lastName: string;
}
