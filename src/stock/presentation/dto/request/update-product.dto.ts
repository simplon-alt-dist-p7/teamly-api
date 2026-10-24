import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  readonly name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  readonly unit: string;

  @IsNumber()
  @Min(0)
  @Max(100000)
  readonly minQuantity: number;
}
