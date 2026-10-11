import { Restaurant } from '@prisma/client';
import { CreateRestaurantRequest } from '../dtos/request/create-restaurant-dto';

export const RESTAURANTS_REPOSITORY = Symbol('RESTAURANTS_REPOSITORY');

export type RestaurantOwnerRecord = {
  readonly id: string;
  readonly name: string;
  readonly ownerEmail: string;
};

export interface RestaurantsRepository {
  create(data: CreateRestaurantRequest, ownerId: string): Promise<Restaurant>;
  findById(id: string): Promise<Restaurant | null>;
  findByOwnerId(ownerId: string): Promise<Restaurant[]>;
  findAll(): Promise<RestaurantOwnerRecord[]>;
}
