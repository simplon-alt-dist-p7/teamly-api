import { Role } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserRequest {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(255)
  readonly password: string;

  @IsNotEmpty()
  @IsEnum(Role)
  readonly role: Role;
}
