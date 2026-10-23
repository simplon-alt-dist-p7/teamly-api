import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
} from 'src/stock/data-access/stock.repository';
import { toMyStockProduct } from '../../queries/get-my-stock/get-my-stock.handler';
import { MyStockProduct } from '../../queries/get-my-stock/get-my-stock.query';
import { CountProductCommand } from './count-product.command';

@CommandHandler(CountProductCommand)
export class CountProductHandler implements ICommandHandler<
  CountProductCommand,
  MyStockProduct
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
  ) {}

  async execute(command: CountProductCommand): Promise<MyStockProduct> {
    const { userId, productId, quantity } = command.props;

    const employee = await this.employeesRepository.findByUserId(userId);
    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const product = await this.stockRepository.findProductById(productId);
    const supplier = product
      ? await this.stockRepository.findSupplierById(product.supplierId)
      : null;
    if (
      !product ||
      !supplier ||
      supplier.restaurantId !== employee.restaurantId
    ) {
      throw new NotFoundException('Produit introuvable');
    }

    const counted = product.count(quantity, new Date());
    await this.stockRepository.updateProductCount(counted);

    const sending = await this.stockRepository.findStockSending(
      employee.restaurantId,
    );
    return toMyStockProduct(counted, sending.sentAt);
  }
}
