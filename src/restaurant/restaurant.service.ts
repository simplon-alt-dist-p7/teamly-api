import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Restaurant } from '@prisma/client';
import type { RestaurantsRepository } from './data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from './data-access/restaurants.repository';
import { CreateRestaurantRequest } from './dtos/request/create-restaurant-dto';
@Injectable()
export class RestaurantService {
  constructor(
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async createRestaurant(
    data: CreateRestaurantRequest,
    ownerId: string,
  ): Promise<Restaurant> {
    const { name } = data;
    if (!name) {
      throw new BadRequestException('name is mandatatory');
    }

    return this.restaurantsRepository.create(data, ownerId);
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant[]> {
    if (!ownerId) {
      throw new BadRequestException('ownerId is mandatatory');
    }

    return this.restaurantsRepository.findByOwnerId(ownerId);
  }
}
