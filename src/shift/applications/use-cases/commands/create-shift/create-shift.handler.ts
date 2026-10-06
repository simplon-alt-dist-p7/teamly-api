import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  SHIFT_REPOSITORY,
  type ShiftRepository,
} from 'src/shift/data-access/shifts.repository';
import { InvalidTimeRangeError } from 'src/shift/domain/errors/time-range.errors';
import { Shift } from 'src/shift/domain/models/shift.entity';
import { TimeRange } from 'src/shift/domain/value-objects/timeRange';
import { CreateShiftCommand } from './create-shift.command';

@CommandHandler(CreateShiftCommand)
export class CreateShiftHandler implements ICommandHandler<
  CreateShiftCommand,
  Shift
> {
  constructor(
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftsRepository: ShiftRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}
  async execute(command: CreateShiftCommand) {
    const employee = await this.employeesRepository.findById(
      command.employeeId,
    );

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

    let timeRange: TimeRange;
    try {
      timeRange = new TimeRange({
        startTime: command.startTime,
        endTime: command.endTime,
      });
    } catch (error) {
      if (error instanceof InvalidTimeRangeError) {
        throw new BadRequestException(
          "L'heure de fin doit être après l'heure de début",
        );
      }
      throw error;
    }

    const newShift = new Shift({
      id: randomUUID(),
      employeeId: command.employeeId,
      timeRange,
    });

    const existing = await this.shiftsRepository.findByEmployeeId(
      command.employeeId,
    );

    if (existing.some((shift) => newShift.overlapsWith(shift))) {
      throw new ConflictException(
        'Cet employé a déjà un créneau sur cet horaire',
      );
    }
    const shiftSaved = await this.shiftsRepository.save(newShift);
    return shiftSaved;
  }
}
