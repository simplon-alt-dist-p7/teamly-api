import { Command } from '@nestjs/cqrs';
import { StockSending } from 'src/stock/data-access/stock.repository';

export type ProductCount = {
  readonly productId: string;
  readonly quantity: number;
};

type SendStockCommandProps = {
  readonly userId: string;
  readonly counts: ProductCount[];
};

export class SendStockCommand extends Command<StockSending> {
  constructor(public readonly props: SendStockCommandProps) {
    super();
  }
}
