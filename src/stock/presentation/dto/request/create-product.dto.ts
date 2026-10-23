import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateProductDto {
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
  readonly minQuantity: number;

  @IsNotEmpty()
  @IsString()
  readonly supplierId: string;
}
