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
import { CreateProductCommand } from 'src/stock/applications/use-cases/commands/create-product/create-product.command';
import { UpdateProductCommand } from 'src/stock/applications/use-cases/commands/update-product/update-product.command';
import { GetProductsQuery } from 'src/stock/applications/use-cases/queries/get-products/get-products.query';
import { CreateProductDto } from '../dto/request/create-product.dto';
import { UpdateProductDto } from '../dto/request/update-product.dto';

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

  @UseGuards(AuthGuard)
  @Patch(':productId')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.commandBus.execute(
      new UpdateProductCommand({
        restaurantId,
        ownerId: req.user.sub,
        productId,
        name: dto.name,
        unit: dto.unit,
        minQuantity: dto.minQuantity,
      }),
    );
  }
}
