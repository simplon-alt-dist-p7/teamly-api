import {
  BadRequestException,
  ConflictException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  LEAVE_REQUEST_REPOSITORY,
  type LeaveRequestRepository,
} from 'src/leave-request/data-access/leave-requests.repository';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  SHIFT_REPOSITORY,
  type ShiftRepository,
} from 'src/shift/data-access/shifts.repository';
import { InvalidTimeRangeError } from 'src/shift/domain/errors/time-range.errors';
import { Shift } from 'src/shift/domain/models/shift.entity';
import { TimeRange } from 'src/shift/domain/value-objects/timeRange';
import { cleanNote } from 'src/shift/partner-planning';
import { ensureCanEditShift } from '../ensure-can-edit-shift';
import { ensureEmployeeNotOnLeave } from '../ensure-employee-not-on-leave';
import { UpdateShiftCommand } from './update-shift.command';

@CommandHandler(UpdateShiftCommand)
export class UpdateShiftHandler implements ICommandHandler<
  UpdateShiftCommand,
  Shift
> {
  constructor(
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftsRepository: ShiftRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
    @Inject(LEAVE_REQUEST_REPOSITORY)
    private readonly leaveRequestsRepository: LeaveRequestRepository,
  ) {}

  async execute(command: UpdateShiftCommand): Promise<Shift> {
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
    await ensureCanEditShift(
      restaurant,
      employee,
      command.ownerId,
      this.employeesRepository,
    );

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
    await ensureEmployeeNotOnLeave(
      employee,
      timeRange.startTime,
      this.leaveRequestsRepository,
    );

    // Without a note in the request, the shift keeps its note.
    const note =
      command.note === undefined ? shift.note : cleanNote(command.note);
    const updatedShift = shift.cloneWithNewTimeRange(timeRange, note);

    const existing = await this.shiftsRepository.findByEmployeeId(
      shift.employeeId,
    );

    const overlaps = existing.some(
      (other) => other.id !== shift.id && updatedShift.overlapsWith(other),
    );
    if (overlaps) {
      throw new ConflictException('Employee already has an overlapping shift');
    }

    return this.shiftsRepository.update(updatedShift);
  }
}
