import { Query } from '@nestjs/cqrs';
import { Product } from 'src/stock/domain/models/product.entity';

type GetProductsQueryProps = {
  readonly restaurantId: string;
  readonly ownerId: string;
};

export class GetProductsQuery extends Query<Product[]> {
  constructor(public readonly props: GetProductsQueryProps) {
    super();
  }
}
