import { Injectable } from '@nestjs/common';
import { Restaurant } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CreateRestaurantRequest } from '../../dtos/request/create-restaurant-dto';
import { RestaurantsRepository } from '../restaurants.repository';

@Injectable()
export class RestaurantsInMemoryRepository implements RestaurantsRepository {
  restaurants: Restaurant[] = [];

  // adapters/restaurants-in-memory.repository.ts
  async create(
    data: CreateRestaurantRequest,
    ownerId: string,
  ): Promise<Restaurant> {
    const restaurant = {
      id: randomUUID(),
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email,
      ownerId,
      createdAt: new Date(),
    } as Restaurant;

    this.restaurants.push(restaurant);
    return restaurant;
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.restaurants.find((r) => r.id === id) ?? null;
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant[]> {
    return this.restaurants.filter(
      (restaurant) => restaurant.ownerId === ownerId,
    );
  }
}
