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

// The list itself leaves through WhatsApp; the app only records who sent it and when.
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
    const employee = await this.employeesRepository.findByUserId(
      command.props.userId,
    );
    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const sending: StockSending = {
      sentAt: new Date(),
      sentBy: employee.firstName,
    };
    await this.stockRepository.saveStockSending(employee.restaurantId, sending);
    return sending;
  }
}
