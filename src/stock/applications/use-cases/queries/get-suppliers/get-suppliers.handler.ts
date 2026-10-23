import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from 'src/stock/data-access/stock.repository';
import { Supplier } from 'src/stock/domain/models/supplier.entity';
import { GetSuppliersQuery } from './get-suppliers.query';

@QueryHandler(GetSuppliersQuery)
export class GetSuppliersHandler implements IQueryHandler<
  GetSuppliersQuery,
  Supplier[]
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(query: GetSuppliersQuery): Promise<Supplier[]> {
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

    return this.stockRepository.findSuppliersByRestaurantId(restaurantId);
  }
}
