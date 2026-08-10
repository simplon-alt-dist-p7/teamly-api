import { Module } from '@nestjs/common';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';

@Module({
  providers: [
    {
      provide: RESTAURANTS_REPOSITORY,
      useClass: RestaurantsInMemoryRepository,
    },
  ],
  exports: [RESTAURANTS_REPOSITORY],
})
export class RestaurantDataAccessUnitTestModule {}
