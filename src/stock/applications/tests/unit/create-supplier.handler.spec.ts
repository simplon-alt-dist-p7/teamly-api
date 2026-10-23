import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { StockInMemoryRepository } from 'src/stock/data-access/adapters/stock-in-memory.repository';
import { STOCK_REPOSITORY } from 'src/stock/data-access/stock.repository';
import { CreateSupplierCommand } from '../../use-cases/commands/create-supplier/create-supplier.command';
import { CreateSupplierHandler } from '../../use-cases/commands/create-supplier/create-supplier.handler';

describe('CreateSupplierHandler', () => {
  let handler: CreateSupplierHandler;
  let stockRepository: StockInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateSupplierHandler,
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

    handler = module.get(CreateSupplierHandler);
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

  it('creates the supplier when everything is valid', async () => {
    const restaurant = await createRestaurant();

    const result = await handler.execute(
      new CreateSupplierCommand({
        restaurantId: restaurant.id,
        ownerId,
        name: ' storia ',
        phone: '0612345678',
      }),
    );

    expect(result.name).toBe('Storia');
    expect(result.phone).toBe('0612345678');
    expect(result.restaurantId).toBe(restaurant.id);
    expect(stockRepository.suppliers).toEqual([result]);
  });

  it('throws ConflictException if the name already exists', async () => {
    const restaurant = await createRestaurant();
    await handler.execute(
      new CreateSupplierCommand({
        restaurantId: restaurant.id,
        ownerId,
        name: 'Storia',
      }),
    );

    await expect(
      handler.execute(
        new CreateSupplierCommand({
          restaurantId: restaurant.id,
          ownerId,
          name: 'STORIA',
        }),
      ),
    ).rejects.toThrow(ConflictException);
    expect(stockRepository.suppliers).toHaveLength(1);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    await expect(
      handler.execute(
        new CreateSupplierCommand({
          restaurantId: 'unknown-restaurant',
          ownerId,
          name: 'Storia',
        }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await createRestaurant();

    await expect(
      handler.execute(
        new CreateSupplierCommand({
          restaurantId: restaurant.id,
          ownerId: 'someone-else',
          name: 'Storia',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(stockRepository.suppliers).toHaveLength(0);
  });

  it('throws BadRequestException when the name is blank', async () => {
    const restaurant = await createRestaurant();

    await expect(
      handler.execute(
        new CreateSupplierCommand({
          restaurantId: restaurant.id,
          ownerId,
          name: '   ',
        }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(stockRepository.suppliers).toHaveLength(0);
  });
});
