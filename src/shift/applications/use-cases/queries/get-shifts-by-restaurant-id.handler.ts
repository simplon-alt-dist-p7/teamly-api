import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  SHIFT_REPOSITORY,
  type ShiftRepository,
} from 'src/shift/data-access/shifts.repository';
import { RestaurantNotFoundError } from 'src/shift/domain/errors/restaurant.errors';
import { Shift } from 'src/shift/domain/models/shift.entity';
import { GetShiftsByRestaurantQuery } from './get-shifts-by-restaurant-id.query';

@QueryHandler(GetShiftsByRestaurantQuery)
export class GetShiftsByRestaurantHandler implements IQueryHandler<
  GetShiftsByRestaurantQuery,
  Shift[]
> {
  constructor(
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftsRepository: ShiftRepository,
  ) {}

  async execute(query: GetShiftsByRestaurantQuery): Promise<Shift[]> {
    const existingRestaurant = await this.restaurantsRepository.findById(
      query.props.restaurantId,
    );

    if (!existingRestaurant) {
      const error = new RestaurantNotFoundError();
      throw new NotFoundException(error.message);
    }

    if (existingRestaurant.ownerId !== query.props.ownerId) {
      throw new ForbiddenException('You are not the owner of this restaurant');
    }

    return this.shiftsRepository.findByRestaurantId(query.props.restaurantId);
  }
}
