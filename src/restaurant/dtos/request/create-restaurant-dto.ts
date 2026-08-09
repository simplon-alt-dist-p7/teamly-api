import { IsNotEmpty } from 'class-validator';

export class CreateRestaurantRequest {
  @IsNotEmpty()
  readonly name: string;
}
