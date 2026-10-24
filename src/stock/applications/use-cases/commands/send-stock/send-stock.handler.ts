import { Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  STOCK_REPOSITORY,
  type StockRepository,
  type StockSending,
} from 'src/stock/data-access/stock.repository';
import { SendStockCommand } from './send-stock.command';

// The employee counts on the phone and sends every checked quantity at once.
// The list itself leaves through WhatsApp; the app saves the quantities, who sent it and when.
@CommandHandler(SendStockCommand)
export class SendStockHandler implements ICommandHandler<
  SendStockCommand,
  StockSending
> {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
  ) {}

  async execute(command: SendStockCommand): Promise<StockSending> {
    const { userId, counts } = command.props;

    const employee = await this.employeesRepository.findByUserId(userId);
    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const restaurantProducts =
      await this.stockRepository.findProductsByRestaurantId(
        employee.restaurantId,
      );
    const sentAt = new Date();

    // Every product is checked before saving anything: a wrong id saves nothing.
    const countedProducts = counts.map((count) => {
      const product = restaurantProducts.find(
        (restaurantProduct) => restaurantProduct.id === count.productId,
      );
      if (!product) {
        throw new NotFoundException('Produit introuvable');
      }
      return product.count(count.quantity, sentAt);
    });

    await Promise.all(
      countedProducts.map((product) =>
        this.stockRepository.updateProductCount(product),
      ),
    );

    const sending: StockSending = { sentAt, sentBy: employee.firstName };
    await this.stockRepository.saveStockSending(employee.restaurantId, sending);
    return sending;
  }
}
