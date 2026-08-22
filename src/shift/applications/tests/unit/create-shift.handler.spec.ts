// src/shift/applications/use-cases/commands/create-shift/tests/create-shift.handler.spec.ts
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';

import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { ShiftsInMemoryRepository } from 'src/shift/data-access/adapters/shifts-in-memory.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { CreateShiftCommand } from '../../use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from '../../use-cases/commands/create-shift/create-shift.handler';

describe('CreateShiftHandler', () => {
  let handler: CreateShiftHandler;
  let shiftsRepository: ShiftsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
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

    handler = module.get(CreateShiftHandler);
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

  const shiftStart = new Date('2026-08-19T09:00:00.000Z');
  const shiftEnd = new Date('2026-08-19T17:00:00.000Z');

  it('throws NotFoundException if employee does not exist', async () => {
    const command = new CreateShiftCommand(
      'unknown-employee',
      new Date('2026-08-19T09:00:00.000Z'),
      new Date('2026-08-19T17:00:00.000Z'),
      'owner-1',
    );

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(shiftsRepository.shifts).toHaveLength(0);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
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

    const command = new CreateShiftCommand(
      employee.id,
      shiftStart,
      shiftEnd,
      'someone-else',
    );

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(shiftsRepository.shifts).toHaveLength(0);
  });

  it('throws ConflictException if the employee already has an overlapping shift', async () => {
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
    const firstCommand = new CreateShiftCommand(
      employee.id,
      new Date('2026-08-19T09:00:00.000Z'),
      new Date('2026-08-19T17:00:00.000Z'),
      'owner-1',
    );
    await handler.execute(firstCommand);

    const overlappingCommand = new CreateShiftCommand(
      employee.id,
      new Date('2026-08-19T12:00:00.000Z'),
      new Date('2026-08-19T20:00:00.000Z'),
      'owner-1',
    );

    await expect(handler.execute(overlappingCommand)).rejects.toThrow(
      ConflictException,
    );
    expect(shiftsRepository.shifts).toHaveLength(1);
  });

  it('creates the shift when everything is valid', async () => {
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

    const command = new CreateShiftCommand(
      employee.id,
      new Date('2026-08-19T09:00:00.000Z'),
      new Date('2026-08-19T17:00:00.000Z'),
      'owner-1',
    );

    const result = await handler.execute(command);

    expect(result.employeeId).toBe(employee.id);
    expect(shiftsRepository.shifts).toHaveLength(1);
  });
});
