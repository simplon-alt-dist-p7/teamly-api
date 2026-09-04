import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  SHIFT_REPOSITORY,
  type ShiftRepository,
} from 'src/shift/data-access/shifts.repository';
import { DeleteShiftCommand } from './delete-shift.command';

@CommandHandler(DeleteShiftCommand)
export class DeleteShiftHandler implements ICommandHandler<
  DeleteShiftCommand,
  void
> {
  constructor(
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftsRepository: ShiftRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: DeleteShiftCommand): Promise<void> {
    const shift = await this.shiftsRepository.findById(command.shiftId);
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    const employee = await this.employeesRepository.findById(shift.employeeId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const restaurant = await this.restaurantsRepository.findById(
      employee.restaurantId,
    );

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (restaurant.ownerId !== command.ownerId) {
      throw new ForbiddenException('You are not the owner of this restaurant');
    }

    await this.shiftsRepository.delete(shift.id);
  }
}
