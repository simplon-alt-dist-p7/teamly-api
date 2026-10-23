import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { StockInMemoryRepository } from 'src/stock/data-access/adapters/stock-in-memory.repository';
import { STOCK_REPOSITORY } from 'src/stock/data-access/stock.repository';
import { Supplier } from 'src/stock/domain/models/supplier.entity';
import { GetSuppliersQuery } from '../../use-cases/queries/get-suppliers/get-suppliers.query';
import { GetSuppliersHandler } from '../../use-cases/queries/get-suppliers/get-suppliers.handler';

describe('GetSuppliersHandler', () => {
  let handler: GetSuppliersHandler;
  let stockRepository: StockInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetSuppliersHandler,
        {
          provide: STOCK_REPOSITORY,
          useClass: StockInMemoryRepository,
        },
        {
          provide: RESTAURANTS_REPOSITORY,
          useClass: RestaurantsInMemoryRepository,
        },
      ],
    }).compile();

    handler = module.get(GetSuppliersHandler);
    stockRepository = module.get(STOCK_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
  });

  const ownerId = 'owner-1';

  const validRestaurantData = {
    name: 'Le Bistrot',
    address: '10 rue de Paris',
    phone: '+33612345678',
    email: 'contact@test.com',
  };

  const createRestaurant = () =>
    restaurantsRepository.create(validRestaurantData, ownerId);

  it('returns the restaurant suppliers', async () => {
    const restaurant = await createRestaurant();
    await stockRepository.createSupplier(
      new Supplier({
        id: 'supplier-storia',
        name: 'Storia',
        phone: '0612345678',
        restaurantId: restaurant.id,
        orderedAt: null,
        createdAt: new Date(),
      }),
    );
    await stockRepository.createSupplier(
      new Supplier({
        id: 'supplier-metro',
        name: 'Metro',
        phone: null,
        restaurantId: restaurant.id,
        orderedAt: null,
        createdAt: new Date(),
      }),
    );

    const result = await handler.execute(
      new GetSuppliersQuery({
        restaurantId: restaurant.id,
        ownerId,
      }),
    );

    expect(result.map((supplier) => supplier.name)).toEqual([
      'Storia',
      'Metro',
    ]);
  });

  it('returns an empty list when the restaurant has no supplier', async () => {
    const restaurant = await createRestaurant();

    const result = await handler.execute(
      new GetSuppliersQuery({
        restaurantId: restaurant.id,
        ownerId,
      }),
    );

    expect(result).toEqual([]);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    await expect(
      handler.execute(
        new GetSuppliersQuery({
          restaurantId: 'unknown-restaurant',
          ownerId,
        }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await createRestaurant();

    await expect(
      handler.execute(
        new GetSuppliersQuery({
          restaurantId: restaurant.id,
          ownerId: 'someone-else',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
