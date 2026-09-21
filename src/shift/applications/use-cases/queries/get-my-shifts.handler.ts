import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { endOfWeek, isWithinInterval, startOfWeek } from 'date-fns';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  SHIFT_REPOSITORY,
  type ShiftRepository,
} from 'src/shift/data-access/shifts.repository';
import { Shift } from 'src/shift/domain/models/shift.entity';
import { GetMyShiftsQuery } from './get-my-shifts.query';

@QueryHandler(GetMyShiftsQuery)
export class GetMyShiftsHandler implements IQueryHandler<
  GetMyShiftsQuery,
  Shift[]
> {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(SHIFT_REPOSITORY)
    private readonly shiftsRepository: ShiftRepository,
  ) {}

  async execute(query: GetMyShiftsQuery): Promise<Shift[]> {
    const employee = await this.employeesRepository.findByUserId(
      query.props.userId,
    );

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const shifts = await this.shiftsRepository.findByEmployeeId(employee.id);

    const weekStart = startOfWeek(query.props.startDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(query.props.startDate, { weekStartsOn: 1 });

    return shifts.filter((shift) =>
      isWithinInterval(shift.timeRange.startTime, {
        start: weekStart,
        end: weekEnd,
      }),
    );
  }
}
