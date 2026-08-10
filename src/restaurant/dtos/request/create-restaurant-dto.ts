import { IsEmail, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class CreateRestaurantRequest {
  @IsNotEmpty()
  readonly name: string;

  @IsNotEmpty()
  readonly address: string;

  @IsPhoneNumber('FR')
  readonly phone: string;

  @IsEmail()
  readonly email: string;
}
