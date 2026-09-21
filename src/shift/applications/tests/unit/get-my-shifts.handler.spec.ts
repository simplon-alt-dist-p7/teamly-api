import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { ShiftsInMemoryRepository } from 'src/shift/data-access/adapters/shifts-in-memory.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { Shift } from 'src/shift/domain/models/shift.entity';
import { TimeRange } from 'src/shift/domain/value-objects/timeRange';
import { GetMyShiftsHandler } from '../../use-cases/queries/get-my-shifts.handler';
import { GetMyShiftsQuery } from '../../use-cases/queries/get-my-shifts.query';

describe('GetMyShiftsHandler', () => {
  let handler: GetMyShiftsHandler;
  let shiftsRepository: ShiftsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyShiftsHandler,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsInMemoryRepository },
        {
          provide: EMPLOYEES_REPOSITORY,
          useClass: EmployeesInMemoryRepository,
        },
      ],
    }).compile();

    handler = module.get(GetMyShiftsHandler);
    shiftsRepository = module.get(SHIFT_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
  });

  const startDate = new Date('2026-09-16T00:00:00.000Z');

  async function createShift(employeeId: string, start: string, end: string) {
    return shiftsRepository.save(
      new Shift({
        id: start,
        employeeId,
        timeRange: new TimeRange({
          startTime: new Date(start),
          endTime: new Date(end),
        }),
      }),
    );
  }

  it('throws NotFoundException if the user has no employee', async () => {
    await expect(
      handler.execute(new GetMyShiftsQuery({ userId: 'owner-1', startDate })),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns only the authenticated employee shifts for the week', async () => {
    const employee = await employeesRepository.create({
      userId: 'user-1',
      restaurantId: 'resto-1',
      firstName: 'Alice',
      lastName: 'Martin',
    });
    const other = await employeesRepository.create({
      userId: 'user-2',
      restaurantId: 'resto-1',
      firstName: 'Bob',
      lastName: 'Durand',
    });

    await createShift(
      employee.id,
      '2026-09-16T09:00:00.000Z',
      '2026-09-16T17:00:00.000Z',
    );
    await createShift(
      employee.id,
      '2026-09-09T09:00:00.000Z',
      '2026-09-09T17:00:00.000Z',
    );
    await createShift(
      other.id,
      '2026-09-16T09:00:00.000Z',
      '2026-09-16T17:00:00.000Z',
    );

    const result = await handler.execute(
      new GetMyShiftsQuery({ userId: 'user-1', startDate }),
    );

    expect(result).toHaveLength(1);
    expect(result[0].employeeId).toBe(employee.id);
    expect(result[0].startTime.toISOString()).toBe('2026-09-16T09:00:00.000Z');
  });

  it('returns an empty array when the employee has no shift that week', async () => {
    await employeesRepository.create({
      userId: 'user-1',
      restaurantId: 'resto-1',
      firstName: 'Alice',
      lastName: 'Martin',
    });

    const result = await handler.execute(
      new GetMyShiftsQuery({ userId: 'user-1', startDate }),
    );

    expect(result).toHaveLength(0);
  });
});
