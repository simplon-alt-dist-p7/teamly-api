import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CountProductCommand } from 'src/stock/applications/use-cases/commands/count-product/count-product.command';
import { SendStockCommand } from 'src/stock/applications/use-cases/commands/send-stock/send-stock.command';
import { GetMyStockQuery } from 'src/stock/applications/use-cases/queries/get-my-stock/get-my-stock.query';
import { CountProductDto } from '../dto/request/count-product.dto';
import { SendStockDto } from '../dto/request/send-stock.dto';

// Employee side: the evening stock count of the employee's restaurant.
@Controller('stock/me')
export class MyStockController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  findMine(@Req() req: AuthenticatedRequest) {
    return this.queryBus.execute(new GetMyStockQuery({ userId: req.user.sub }));
  }

  @UseGuards(AuthGuard)
  @Patch('products/:productId/count')
  count(
    @Req() req: AuthenticatedRequest,
    @Param('productId') productId: string,
    @Body() dto: CountProductDto,
  ) {
    return this.commandBus.execute(
      new CountProductCommand({
        userId: req.user.sub,
        productId,
        quantity: dto.quantity,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Post('send')
  send(@Req() req: AuthenticatedRequest, @Body() dto: SendStockDto) {
    return this.commandBus.execute(
      new SendStockCommand({ userId: req.user.sub, counts: dto.counts }),
    );
  }
}
