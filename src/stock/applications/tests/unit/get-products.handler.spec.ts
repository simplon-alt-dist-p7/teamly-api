import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { StockInMemoryRepository } from 'src/stock/data-access/adapters/stock-in-memory.repository';
import { STOCK_REPOSITORY } from 'src/stock/data-access/stock.repository';
import { Product } from 'src/stock/domain/models/product.entity';
import { Supplier } from 'src/stock/domain/models/supplier.entity';
import { GetProductsHandler } from '../../use-cases/queries/get-products/get-products.handler';
import { GetProductsQuery } from '../../use-cases/queries/get-products/get-products.query';

describe('GetProductsHandler', () => {
  let handler: GetProductsHandler;
  let stockRepository: StockInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsHandler,
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

    handler = module.get(GetProductsHandler);
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

  const createSupplier = (id: string, restaurantId: string) =>
    stockRepository.createSupplier(
      new Supplier({
        id,
        name: id,
        phone: null,
        restaurantId,
        orderedAt: null,
        createdAt: new Date(),
      }),
    );

  const createProduct = (name: string, supplierId: string) =>
    stockRepository.createProduct(
      new Product({
        id: `product-${name}`,
        name,
        unit: 'pièce',
        minQuantity: 1,
        quantity: 0,
        countedAt: null,
        supplierId,
        createdAt: new Date(),
      }),
    );

  it('returns the restaurant products', async () => {
    const restaurant = await createRestaurant();
    await createSupplier('storia', restaurant.id);
    await createProduct('Stracciatella', 'storia');
    await createProduct('Burrata', 'storia');

    const result = await handler.execute(
      new GetProductsQuery({ restaurantId: restaurant.id, ownerId }),
    );

    expect(result.map((product) => product.name)).toEqual([
      'Stracciatella',
      'Burrata',
    ]);
  });

  it('does not return the products of another restaurant', async () => {
    const restaurant = await createRestaurant();
    const otherRestaurant = await createRestaurant();
    await createSupplier('storia', restaurant.id);
    await createSupplier('metro', otherRestaurant.id);
    await createProduct('Burrata', 'storia');
    await createProduct('Ricotta', 'metro');

    const result = await handler.execute(
      new GetProductsQuery({ restaurantId: restaurant.id, ownerId }),
    );

    expect(result.map((product) => product.name)).toEqual(['Burrata']);
  });

  it('returns an empty list when the restaurant has no product', async () => {
    const restaurant = await createRestaurant();

    const result = await handler.execute(
      new GetProductsQuery({ restaurantId: restaurant.id, ownerId }),
    );

    expect(result).toEqual([]);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    await expect(
      handler.execute(
        new GetProductsQuery({ restaurantId: 'unknown-restaurant', ownerId }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await createRestaurant();

    await expect(
      handler.execute(
        new GetProductsQuery({
          restaurantId: restaurant.id,
          ownerId: 'someone-else',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
