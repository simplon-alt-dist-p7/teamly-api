import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { StockInMemoryRepository } from 'src/stock/data-access/adapters/stock-in-memory.repository';
import { STOCK_REPOSITORY } from 'src/stock/data-access/stock.repository';
import { Product } from 'src/stock/domain/models/product.entity';
import { Supplier } from 'src/stock/domain/models/supplier.entity';
import { CountProductCommand } from '../../use-cases/commands/count-product/count-product.command';
import { CountProductHandler } from '../../use-cases/commands/count-product/count-product.handler';
import { SendStockCommand } from '../../use-cases/commands/send-stock/send-stock.command';
import { SendStockHandler } from '../../use-cases/commands/send-stock/send-stock.handler';
import { GetMyStockHandler } from '../../use-cases/queries/get-my-stock/get-my-stock.handler';
import { GetMyStockQuery } from '../../use-cases/queries/get-my-stock/get-my-stock.query';

describe('My stock (evening count)', () => {
  let getMyStock: GetMyStockHandler;
  let countProduct: CountProductHandler;
  let sendStock: SendStockHandler;
  let stockRepository: StockInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyStockHandler,
        CountProductHandler,
        SendStockHandler,
        { provide: STOCK_REPOSITORY, useClass: StockInMemoryRepository },
        {
          provide: EMPLOYEES_REPOSITORY,
          useClass: EmployeesInMemoryRepository,
        },
        {
          provide: RESTAURANTS_REPOSITORY,
          useClass: RestaurantsInMemoryRepository,
        },
      ],
    }).compile();

    getMyStock = module.get(GetMyStockHandler);
    countProduct = module.get(CountProductHandler);
    sendStock = module.get(SendStockHandler);
    stockRepository = module.get(STOCK_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
  });

  const createRestaurant = () =>
    restaurantsRepository.create(
      {
        name: 'Fratellino',
        address: '10 rue de Paris',
        phone: '+33612345678',
        email: 'contact@test.com',
      },
      'owner-1',
    );

  const createEmployee = (restaurantId: string) =>
    employeesRepository.create({
      userId: 'user-1',
      restaurantId,
      firstName: 'Inès',
      lastName: 'Martin',
    });

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

  const createProduct = (name: string, supplierId: string, quantity = 0) =>
    stockRepository.createProduct(
      new Product({
        id: `product-${name}`,
        name,
        unit: 'pièce',
        minQuantity: 2,
        quantity,
        countedAt: null,
        supplierId,
        createdAt: new Date(),
      }),
    );

  describe('GetMyStockHandler', () => {
    it('throws NotFoundException if the user has no employee', async () => {
      await expect(
        getMyStock.execute(new GetMyStockQuery({ userId: 'owner-1' })),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns the products of the employee restaurant grouped by supplier', async () => {
      const restaurant = await createRestaurant();
      const other = await createRestaurant();
      await createEmployee(restaurant.id);
      await createSupplier('storia', restaurant.id);
      await createSupplier('metro', restaurant.id);
      await createSupplier('empty', restaurant.id);
      await createSupplier('elsewhere', other.id);
      await createProduct('Stracciatella', 'storia', 4);
      await createProduct('Burrata', 'storia', 1);
      await createProduct('Citrons', 'metro', 10);
      await createProduct('Ricotta', 'elsewhere');

      const result = await getMyStock.execute(
        new GetMyStockQuery({ userId: 'user-1' }),
      );

      expect(result.restaurantName).toBe('Fratellino');
      expect(result.sentAt).toBeNull();
      expect(
        result.suppliers.map((supplier) => ({
          name: supplier.name,
          products: supplier.products.map((product) => [
            product.name,
            product.urgent,
            product.checked,
          ]),
        })),
      ).toEqual([
        {
          name: 'Storia',
          products: [
            ['Stracciatella', false, false],
            ['Burrata', true, false],
          ],
        },
        { name: 'Metro', products: [['Citrons', false, false]] },
      ]);
    });
  });

  describe('CountProductHandler', () => {
    it('saves the quantity and marks the product as checked', async () => {
      const restaurant = await createRestaurant();
      await createEmployee(restaurant.id);
      await createSupplier('storia', restaurant.id);
      await createProduct('Burrata', 'storia', 8);

      const result = await countProduct.execute(
        new CountProductCommand({
          userId: 'user-1',
          productId: 'product-Burrata',
          quantity: 1,
        }),
      );

      expect(result).toMatchObject({
        quantity: 1,
        urgent: true,
        checked: true,
      });
      const saved = await stockRepository.findProductById('product-Burrata');
      expect(saved?.quantity).toBe(1);
      expect(saved?.countedAt).not.toBeNull();
    });

    it('throws NotFoundException for a product of another restaurant', async () => {
      const restaurant = await createRestaurant();
      const other = await createRestaurant();
      await createEmployee(restaurant.id);
      await createSupplier('elsewhere', other.id);
      await createProduct('Ricotta', 'elsewhere');

      await expect(
        countProduct.execute(
          new CountProductCommand({
            userId: 'user-1',
            productId: 'product-Ricotta',
            quantity: 3,
          }),
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for an unknown product', async () => {
      const restaurant = await createRestaurant();
      await createEmployee(restaurant.id);

      await expect(
        countProduct.execute(
          new CountProductCommand({
            userId: 'user-1',
            productId: 'unknown',
            quantity: 3,
          }),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('SendStockHandler', () => {
    it('saves all the counted quantities in one sending', async () => {
      const restaurant = await createRestaurant();
      await createEmployee(restaurant.id);
      await createSupplier('storia', restaurant.id);
      await createProduct('Burrata', 'storia', 8);
      await createProduct('Gorgonzola', 'storia', 2);
      await createProduct('Ricotta', 'storia', 3);

      const sending = await sendStock.execute(
        new SendStockCommand({
          userId: 'user-1',
          counts: [
            { productId: 'product-Burrata', quantity: 5 },
            { productId: 'product-Gorgonzola', quantity: 0 },
          ],
        }),
      );

      expect(sending.sentBy).toBe('Inès');
      expect(sending.sentAt).toBeInstanceOf(Date);
      const burrata = await stockRepository.findProductById('product-Burrata');
      const gorgonzola =
        await stockRepository.findProductById('product-Gorgonzola');
      const ricotta = await stockRepository.findProductById('product-Ricotta');
      expect(burrata?.quantity).toBe(5);
      expect(gorgonzola?.quantity).toBe(0);
      expect(ricotta?.quantity).toBe(3);
      expect(ricotta?.countedAt).toBeNull();
    });

    it('starts the next list with every product unchecked', async () => {
      const restaurant = await createRestaurant();
      await createEmployee(restaurant.id);
      await createSupplier('storia', restaurant.id);
      await createProduct('Burrata', 'storia', 8);

      await sendStock.execute(
        new SendStockCommand({
          userId: 'user-1',
          counts: [{ productId: 'product-Burrata', quantity: 5 }],
        }),
      );

      const stock = await getMyStock.execute(
        new GetMyStockQuery({ userId: 'user-1' }),
      );
      expect(stock.sentBy).toBe('Inès');
      expect(stock.suppliers[0].products[0]).toMatchObject({
        quantity: 5,
        checked: false,
      });
    });

    it('saves nothing if a product belongs to another restaurant', async () => {
      const restaurant = await createRestaurant();
      const other = await createRestaurant();
      await createEmployee(restaurant.id);
      await createSupplier('storia', restaurant.id);
      await createSupplier('elsewhere', other.id);
      await createProduct('Burrata', 'storia', 8);
      await createProduct('Ricotta', 'elsewhere', 3);

      await expect(
        sendStock.execute(
          new SendStockCommand({
            userId: 'user-1',
            counts: [
              { productId: 'product-Burrata', quantity: 5 },
              { productId: 'product-Ricotta', quantity: 0 },
            ],
          }),
        ),
      ).rejects.toThrow(NotFoundException);

      const burrata = await stockRepository.findProductById('product-Burrata');
      expect(burrata?.quantity).toBe(8);
      const sending = await stockRepository.findStockSending(restaurant.id);
      expect(sending.sentAt).toBeNull();
    });

    it('throws NotFoundException if the user has no employee', async () => {
      await expect(
        sendStock.execute(
          new SendStockCommand({ userId: 'owner-1', counts: [] }),
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
