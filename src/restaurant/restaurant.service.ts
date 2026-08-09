import { BadRequestException, Injectable } from '@nestjs/common';
import { Restaurant } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRestaurantRequest } from './dtos/request/create-restaurant-dto';
@Injectable()
export class RestaurantService {
  constructor(private readonly prisma: PrismaService) {}

  async createRestaurant(
    data: CreateRestaurantRequest,
    ownerId: string,
  ): Promise<Restaurant> {
    const { name } = data;
    if (!name) {
      throw new BadRequestException('name is mandatory');
    }

    return await this.prisma.restaurant.create({
      data: {
        name,
        ownerId,
      },
    });
  }
}
