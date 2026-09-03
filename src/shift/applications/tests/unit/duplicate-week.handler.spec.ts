import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test, TestingModule } from '@nestjs/testing';
import { addDays } from 'date-fns';

import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { ShiftsInMemoryRepository } from 'src/shift/data-access/adapters/shifts-in-memory.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { CreateShiftCommand } from '../../use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from '../../use-cases/commands/create-shift/create-shift.handler';
import { DuplicateWeekCommand } from '../../use-cases/commands/duplicate-week/duplicate-shift.command';
import { DuplicateWeekHandler } from '../../use-cases/commands/duplicate-week/duplicate-shift.handler';

describe('DuplicateWeekHandler', () => {
  let handler: DuplicateWeekHandler;
  let createShiftHandler: CreateShiftHandler;
  let shiftsRepository: ShiftsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        DuplicateWeekHandler,
        CreateShiftHandler,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsInMemoryRepository },
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

    await module.init();

    handler = module.get(DuplicateWeekHandler);
    createShiftHandler = module.get(CreateShiftHandler);
    shiftsRepository = module.get(SHIFT_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
  });

  const ownerId = 'owner-1';

  const validRestaurantData = {
    name: 'Le Bistrot',
    address: '10 rue de Paris',
    phone: '+33612345678',
    email: 'contact@test.com',
  };

  const referenceDate = new Date('2026-08-19T12:00:00.000Z');
  const shiftStart = new Date('2026-08-19T09:00:00.000Z');
  const shiftEnd = new Date('2026-08-19T17:00:00.000Z');

  it('throws NotFoundException if restaurant does not exist', async () => {
    await expect(
      handler.execute(
        new DuplicateWeekCommand({
          restaurantId: 'unknown',
          referenceDate,
          ownerId,
        }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );

    await expect(
      handler.execute(
        new DuplicateWeekCommand({
          restaurantId: restaurant.id,
          referenceDate,
          ownerId: 'someone-else',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('duplicates the week shifts to +7 days', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );
    const employee = await employeesRepository.create({
      userId: 'user-1',
      restaurantId: restaurant.id,
      firstName: 'Alice',
      lastName: 'Martin',
    });

    await createShiftHandler.execute(
      new CreateShiftCommand(employee.id, shiftStart, shiftEnd, ownerId),
    );
    expect(shiftsRepository.shifts).toHaveLength(1);

    await handler.execute(
      new DuplicateWeekCommand({
        restaurantId: restaurant.id,
        referenceDate,
        ownerId,
      }),
    );

    expect(shiftsRepository.shifts).toHaveLength(2);
    expect(shiftsRepository.shifts[1].employeeId).toBe(employee.id);
    expect(shiftsRepository.shifts[1].startTime.getTime()).toBe(
      addDays(shiftStart, 7).getTime(),
    );
    expect(shiftsRepository.shifts[1].endTime.getTime()).toBe(
      addDays(shiftEnd, 7).getTime(),
    );
  });

  it('skips when the target week already has an overlapping shift', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );
    const employee = await employeesRepository.create({
      userId: 'user-1',
      restaurantId: restaurant.id,
      firstName: 'Alice',
      lastName: 'Martin',
    });

    await createShiftHandler.execute(
      new CreateShiftCommand(employee.id, shiftStart, shiftEnd, ownerId),
    );
    await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        addDays(shiftStart, 7),
        addDays(shiftEnd, 7),
        ownerId,
      ),
    );
    expect(shiftsRepository.shifts).toHaveLength(2);

    await handler.execute(
      new DuplicateWeekCommand({
        restaurantId: restaurant.id,
        referenceDate,
        ownerId,
      }),
    );

    expect(shiftsRepository.shifts).toHaveLength(2);
  });
});
