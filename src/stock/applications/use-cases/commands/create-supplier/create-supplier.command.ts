import { Command } from '@nestjs/cqrs';
import { Supplier } from 'src/stock/domain/models/supplier.entity';

type CreateSupplierCommandProps = {
  readonly restaurantId: string;
  readonly ownerId: string;
  readonly name: string;
  readonly phone?: string | null;
};

export class CreateSupplierCommand extends Command<Supplier> {
  constructor(public readonly props: CreateSupplierCommandProps) {
    super();
  }
}
