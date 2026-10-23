import { Query } from '@nestjs/cqrs';
import { Supplier } from 'src/stock/domain/models/supplier.entity';

type GetSuppliersQueryProps = {
  readonly restaurantId: string;
  readonly ownerId: string;
};

export class GetSuppliersQuery extends Query<Supplier[]> {
  constructor(public readonly props: GetSuppliersQueryProps) {
    super();
  }
}
