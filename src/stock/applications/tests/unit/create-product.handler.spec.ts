import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { StockInMemoryRepository } from 'src/stock/data-access/adapters/stock-in-memory.repository';
import { STOCK_REPOSITORY } from 'src/stock/data-access/stock.repository';
import { Supplier } from 'src/stock/domain/models/supplier.entity';
import { CreateProductCommand } from '../../use-cases/commands/create-product/create-product.command';
import { CreateProductHandler } from '../../use-cases/commands/create-product/create-product.handler';

describe('CreateProductHandler', () => {
  let handler: CreateProductHandler;
  let stockRepository: StockInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProductHandler,
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

    handler = module.get(CreateProductHandler);
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

  const createSupplier = (restaurantId: string, id = 'supplier-1') =>
    stockRepository.createSupplier(
      new Supplier({
        id,
        name: 'Storia',
        phone: '0612345678',
        restaurantId,
        orderedAt: null,
        createdAt: new Date(),
      }),
    );

  it('creates the product for an existing supplier', async () => {
    const restaurant = await createRestaurant();
    await createSupplier(restaurant.id);

    const result = await handler.execute(
      new CreateProductCommand({
        restaurantId: restaurant.id,
        ownerId,
        name: 'farine',
        unit: 'KG',
        minQuantity: 2,
        supplierId: 'supplier-1',
      }),
    );

    expect(result.name).toBe('Farine');
    expect(result.unit).toBe('kg');
    expect(result.minQuantity).toBe(2);
    expect(result.quantity).toBe(0);
    expect(result.countedAt).toBeNull();
    expect(result.supplierId).toBe('supplier-1');
    expect(stockRepository.products).toEqual([result]);
    expect(stockRepository.suppliers).toHaveLength(1);
  });

  it('throws NotFoundException if the supplier belongs to another restaurant', async () => {
    const restaurant = await createRestaurant();
    const otherRestaurant = await restaurantsRepository.create(
      validRestaurantData,
      'owner-2',
    );
    await createSupplier(otherRestaurant.id);

    await expect(
      handler.execute(
        new CreateProductCommand({
          restaurantId: restaurant.id,
          ownerId,
          name: 'Farine',
          unit: 'kg',
          minQuantity: 2,
          supplierId: 'supplier-1',
        }),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(stockRepository.products).toHaveLength(0);
  });

  it('throws NotFoundException if the supplier does not exist', async () => {
    const restaurant = await createRestaurant();

    await expect(
      handler.execute(
        new CreateProductCommand({
          restaurantId: restaurant.id,
          ownerId,
          name: 'Farine',
          unit: 'kg',
          minQuantity: 2,
          supplierId: 'unknown-supplier',
        }),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(stockRepository.products).toHaveLength(0);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    await expect(
      handler.execute(
        new CreateProductCommand({
          restaurantId: 'unknown-restaurant',
          ownerId,
          name: 'Farine',
          unit: 'kg',
          minQuantity: 2,
          supplierId: 'supplier-1',
        }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await createRestaurant();
    await createSupplier(restaurant.id);

    await expect(
      handler.execute(
        new CreateProductCommand({
          restaurantId: restaurant.id,
          ownerId: 'someone-else',
          name: 'Farine',
          unit: 'kg',
          minQuantity: 2,
          supplierId: 'supplier-1',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect(stockRepository.products).toHaveLength(0);
  });

  it('throws BadRequestException when the product name is blank', async () => {
    const restaurant = await createRestaurant();
    await createSupplier(restaurant.id);

    await expect(
      handler.execute(
        new CreateProductCommand({
          restaurantId: restaurant.id,
          ownerId,
          name: '   ',
          unit: 'kg',
          minQuantity: 2,
          supplierId: 'supplier-1',
        }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(stockRepository.products).toHaveLength(0);
    expect(stockRepository.suppliers).toHaveLength(1);
  });

  it('throws BadRequestException when minQuantity is negative', async () => {
    const restaurant = await createRestaurant();
    await createSupplier(restaurant.id);

    await expect(
      handler.execute(
        new CreateProductCommand({
          restaurantId: restaurant.id,
          ownerId,
          name: 'Farine',
          unit: 'kg',
          minQuantity: -1,
          supplierId: 'supplier-1',
        }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(stockRepository.products).toHaveLength(0);
  });
});
