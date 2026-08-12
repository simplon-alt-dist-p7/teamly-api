import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { RestaurantsPrismaRepository } from './data-access/adapters/restaurants-prisma.repository';
import { RESTAURANTS_REPOSITORY } from './data-access/restaurants.repository';
import { RestaurantController } from './restaurant.controller';
import { RestaurantService } from './restaurant.service';

@Module({
  imports: [PrismaModule],
  controllers: [RestaurantController],
  providers: [
    RestaurantService,
    { provide: RESTAURANTS_REPOSITORY, useClass: RestaurantsPrismaRepository },
  ],
  exports: [RESTAURANTS_REPOSITORY],
})
export class RestaurantModule {}
