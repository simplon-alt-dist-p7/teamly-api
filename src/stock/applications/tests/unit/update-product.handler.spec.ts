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
import { Product } from 'src/stock/domain/models/product.entity';
import { Supplier } from 'src/stock/domain/models/supplier.entity';
import { UpdateProductCommand } from '../../use-cases/commands/update-product/update-product.command';
import { UpdateProductHandler } from '../../use-cases/commands/update-product/update-product.handler';

describe('UpdateProductHandler', () => {
  let handler: UpdateProductHandler;
  let stockRepository: StockInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProductHandler,
        { provide: STOCK_REPOSITORY, useClass: StockInMemoryRepository },
        {
          provide: RESTAURANTS_REPOSITORY,
          useClass: RestaurantsInMemoryRepository,
        },
      ],
    }).compile();

    handler = module.get(UpdateProductHandler);
    stockRepository = module.get(STOCK_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
  });

  const ownerId = 'owner-1';

  const createRestaurant = (restaurantOwnerId = ownerId) =>
    restaurantsRepository.create(
      {
        name: 'Fratellino',
        address: '10 rue de Paris',
        phone: '+33612345678',
        email: 'contact@test.com',
      },
      restaurantOwnerId,
    );

  const createSupplier = (supplierId: string, restaurantId: string) =>
    stockRepository.createSupplier(
      new Supplier({
        id: supplierId,
        name: supplierId,
        phone: null,
        restaurantId,
        orderedAt: null,
        createdAt: new Date(),
      }),
    );

  const createBurrata = (supplierId: string) =>
    stockRepository.createProduct(
      new Product({
        id: 'product-burrata',
        name: 'Burrata',
        unit: 'pièces',
        minQuantity: 2,
        quantity: 6,
        countedAt: null,
        supplierId,
        createdAt: new Date(),
      }),
    );

  const updateBurrata = (restaurantId: string, minQuantity = 4) =>
    handler.execute(
      new UpdateProductCommand({
        restaurantId,
        ownerId,
        productId: 'product-burrata',
        name: 'burrata 125g',
        unit: 'Pièces',
        minQuantity,
      }),
    );

  it('updates the name, the unit and the threshold, and keeps the quantity', async () => {
    const restaurant = await createRestaurant();
    await createSupplier('storia', restaurant.id);
    await createBurrata('storia');

    const result = await updateBurrata(restaurant.id);

    expect(result).toMatchObject({
      name: 'Burrata 125g',
      unit: 'pièces',
      minQuantity: 4,
      quantity: 6,
    });
    const savedProduct =
      await stockRepository.findProductById('product-burrata');
    expect(savedProduct?.minQuantity).toBe(4);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    await expect(updateBurrata('unknown')).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if the user does not own the restaurant', async () => {
    const restaurant = await createRestaurant('someone-else');

    await expect(updateBurrata(restaurant.id)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws NotFoundException for a product of another restaurant', async () => {
    const restaurant = await createRestaurant();
    const otherRestaurant = await createRestaurant();
    await createSupplier('elsewhere', otherRestaurant.id);
    await createBurrata('elsewhere');

    await expect(updateBurrata(restaurant.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException for a negative threshold', async () => {
    const restaurant = await createRestaurant();
    await createSupplier('storia', restaurant.id);
    await createBurrata('storia');

    await expect(updateBurrata(restaurant.id, -1)).rejects.toThrow(
      BadRequestException,
    );
  });
});
