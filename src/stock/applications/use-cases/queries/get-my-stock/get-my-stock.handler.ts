import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from 'src/stock/data-access/stock.repository';
import { Product } from 'src/stock/domain/models/product.entity';
import {
  GetMyStockQuery,
  MyStock,
  MyStockProduct,
  MyStockSupplier,
} from './get-my-stock.query';

@QueryHandler(GetMyStockQuery)
export class GetMyStockHandler implements IQueryHandler<
  GetMyStockQuery,
  MyStock
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(query: GetMyStockQuery): Promise<MyStock> {
    const employee = await this.employeesRepository.findByUserId(
      query.props.userId,
    );
    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const restaurant = await this.restaurantsRepository.findById(
      employee.restaurantId,
    );
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }

    const [suppliers, products, sending] = await Promise.all([
      this.stockRepository.findSuppliersByRestaurantId(restaurant.id),
      this.stockRepository.findProductsByRestaurantId(restaurant.id),
      this.stockRepository.findStockSending(restaurant.id),
    ]);

    const mySuppliers: MyStockSupplier[] = [];

    for (const supplier of suppliers) {
      const supplierProducts: MyStockProduct[] = [];

      for (const product of products) {
        if (product.supplierId !== supplier.id) continue;
        supplierProducts.push(toMyStockProduct(product, sending.sentAt));
      }

      if (supplierProducts.length === 0) continue;

      mySuppliers.push({
        id: supplier.id,
        name: supplier.name,
        products: supplierProducts,
      });
    }

    return {
      restaurantName: restaurant.name,
      sentAt: sending.sentAt,
      sentBy: sending.sentBy,
      suppliers: mySuppliers,
    };
  }
}

export function toMyStockProduct(
  product: Product,
  stockSentAt: Date | null,
): MyStockProduct {
  return {
    id: product.id,
    name: product.name,
    unit: product.unit,
    minQuantity: product.minQuantity,
    quantity: product.quantity,
    urgent: product.isUrgent(),
    checked: product.isCheckedForCurrentList(stockSentAt),
  };
}
