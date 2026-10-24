import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProductCountDto {
  @IsString()
  readonly productId: string;

  @IsNumber()
  @Min(0)
  @Max(100000)
  readonly quantity: number;
}

export class SendStockDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductCountDto)
  readonly counts: ProductCountDto[];
}
