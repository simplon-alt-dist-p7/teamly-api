import { Command } from '@nestjs/cqrs';
import { Product } from 'src/stock/domain/models/product.entity';

type UpdateProductCommandProps = {
  readonly restaurantId: string;
  readonly ownerId: string;
  readonly productId: string;
  readonly name: string;
  readonly unit: string;
  readonly minQuantity: number;
};

export class UpdateProductCommand extends Command<Product> {
  constructor(public readonly props: UpdateProductCommandProps) {
    super();
  }
}
