import { Command } from '@nestjs/cqrs';
import { Product } from 'src/stock/domain/models/product.entity';

type CreateProductCommandProps = {
  readonly restaurantId: string;
  readonly ownerId: string;
  readonly name: string;
  readonly unit: string;
  readonly minQuantity: number;
  readonly supplierId: string;
};

export class CreateProductCommand extends Command<Product> {
  constructor(public readonly props: CreateProductCommandProps) {
    super();
  }
}
