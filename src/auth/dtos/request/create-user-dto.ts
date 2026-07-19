import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateUserRequest {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MaxLength(255)
  readonly password: string;

  @IsNotEmpty()
  @IsEnum(Role)
  readonly role: Role;
}
