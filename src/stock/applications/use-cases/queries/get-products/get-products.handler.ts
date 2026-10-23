import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from 'src/stock/data-access/stock.repository';
import { Product } from 'src/stock/domain/models/product.entity';
import { GetProductsQuery } from './get-products.query';

@QueryHandler(GetProductsQuery)
export class GetProductsHandler implements IQueryHandler<
  GetProductsQuery,
  Product[]
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(query: GetProductsQuery): Promise<Product[]> {
    const { restaurantId, ownerId } = query.props;

    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    return this.stockRepository.findProductsByRestaurantId(restaurantId);
  }
}
