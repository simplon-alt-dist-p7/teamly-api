import { Injectable } from '@nestjs/common';
import { Restaurant } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRestaurantRequest } from '../../dtos/request/create-restaurant-dto';
import { RestaurantsRepository } from '../restaurants.repository';

@Injectable()
export class RestaurantsPrismaRepository implements RestaurantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByOwnerId(ownerId: string): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({ where: { ownerId } });
  }

  async create(
    data: CreateRestaurantRequest,
    ownerId: string,
  ): Promise<Restaurant> {
    return this.prisma.restaurant.create({
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        ownerId,
      },
    });
  }

  async findById(id: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findUnique({ where: { id } });
  }
}
