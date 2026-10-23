import { Command } from '@nestjs/cqrs';
import { StockSending } from 'src/stock/data-access/stock.repository';

type SendStockCommandProps = {
  readonly userId: string;
};

export class SendStockCommand extends Command<StockSending> {
  constructor(public readonly props: SendStockCommandProps) {
    super();
  }
}
