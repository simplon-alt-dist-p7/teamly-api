import { IsNumber, Max, Min } from 'class-validator';

export class CountProductDto {
  @IsNumber()
  @Min(0)
  @Max(100000)
  readonly quantity: number;
}
