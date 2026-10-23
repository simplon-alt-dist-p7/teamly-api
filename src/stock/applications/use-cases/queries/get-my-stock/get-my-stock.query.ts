import { Query } from '@nestjs/cqrs';

export type MyStockProduct = {
  readonly id: string;
  readonly name: string;
  readonly unit: string;
  readonly minQuantity: number;
  readonly quantity: number;
  readonly urgent: boolean;
  readonly checked: boolean;
};

export type MyStockSupplier = {
  readonly id: string;
  readonly name: string;
  readonly products: MyStockProduct[];
};

export type MyStock = {
  readonly restaurantName: string;
  readonly sentAt: Date | null;
  readonly sentBy: string | null;
  readonly suppliers: MyStockSupplier[];
};

type GetMyStockQueryProps = {
  readonly userId: string;
};

export class GetMyStockQuery extends Query<MyStock> {
  constructor(public readonly props: GetMyStockQueryProps) {
    super();
  }
}
