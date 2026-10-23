import { Command } from '@nestjs/cqrs';
import { MyStockProduct } from '../../queries/get-my-stock/get-my-stock.query';

type CountProductCommandProps = {
  readonly userId: string;
  readonly productId: string;
  readonly quantity: number;
};

export class CountProductCommand extends Command<MyStockProduct> {
  constructor(public readonly props: CountProductCommandProps) {
    super();
  }
}
