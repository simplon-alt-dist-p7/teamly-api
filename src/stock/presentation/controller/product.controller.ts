import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CreateProductCommand } from 'src/stock/applications/use-cases/commands/create-product/create-product.command';
import { GetProductsQuery } from 'src/stock/applications/use-cases/queries/get-products/get-products.query';
import { CreateProductDto } from '../dto/request/create-product.dto';

@Controller('restaurant/:restaurantId/products')
export class ProductController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.commandBus.execute(
      new CreateProductCommand({
        restaurantId,
        ownerId: req.user.sub,
        name: dto.name,
        unit: dto.unit,
        minQuantity: dto.minQuantity,
        supplierId: dto.supplierId,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findByRestaurantId(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.queryBus.execute(
      new GetProductsQuery({
        restaurantId,
        ownerId: req.user.sub,
      }),
    );
  }
}
