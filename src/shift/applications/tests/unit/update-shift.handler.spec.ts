import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { ShiftsInMemoryRepository } from 'src/shift/data-access/adapters/shifts-in-memory.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { CreateShiftCommand } from '../../use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from '../../use-cases/commands/create-shift/create-shift.handler';
import { UpdateShiftCommand } from '../../use-cases/commands/update-shift/update-shift.command';
import { UpdateShiftHandler } from '../../use-cases/commands/update-shift/update-shift.handler';

describe('UpdateShiftHandler', () => {
  let updateHandler: UpdateShiftHandler;
  let createHandler: CreateShiftHandler;
  let shiftsRepository: ShiftsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  const ownerId = 'owner-1';
  const validRestaurantData = {
    name: 'Le Bistrot',
    address: '10 rue de Paris',
    phone: '+33612345678',
    email: 'contact@test.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateShiftHandler,
        UpdateShiftHandler,
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

    updateHandler = module.get(UpdateShiftHandler);
    createHandler = module.get(CreateShiftHandler);
    shiftsRepository = module.get(SHIFT_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
  });

  async function setupEmployee() {
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
    return employee;
  }

  it('throws NotFoundException if shift does not exist', async () => {
    const command = new UpdateShiftCommand(
      'unknown-shift',
      new Date('2026-08-19T10:00:00.000Z'),
      new Date('2026-08-19T18:00:00.000Z'),
      ownerId,
    );

    await expect(updateHandler.execute(command)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const employee = await setupEmployee();
    const shift = await createHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        ownerId,
      ),
    );

    const command = new UpdateShiftCommand(
      shift.id,
      new Date('2026-08-19T10:00:00.000Z'),
      new Date('2026-08-19T18:00:00.000Z'),
      'someone-else',
    );

    await expect(updateHandler.execute(command)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('updates the shift when everything is valid', async () => {
    const employee = await setupEmployee();
    const shift = await createHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        ownerId,
      ),
    );

    const newStart = new Date('2026-08-19T10:00:00.000Z');
    const newEnd = new Date('2026-08-19T18:00:00.000Z');

    const result = await updateHandler.execute(
      new UpdateShiftCommand(shift.id, newStart, newEnd, ownerId),
    );

    expect(result.id).toBe(shift.id);
    expect(result.startTime).toEqual(newStart);
    expect(result.endTime).toEqual(newEnd);
    expect(shiftsRepository.shifts).toHaveLength(1);
  });

  it('throws ConflictException if update overlaps another shift', async () => {
    const employee = await setupEmployee();

    const morning = await createHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T12:00:00.000Z'),
        ownerId,
      ),
    );
    await createHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T14:00:00.000Z'),
        new Date('2026-08-19T18:00:00.000Z'),
        ownerId,
      ),
    );

    // morning étendu jusqu'à 15h → overlap avec l'après-midi
    await expect(
      updateHandler.execute(
        new UpdateShiftCommand(
          morning.id,
          new Date('2026-08-19T09:00:00.000Z'),
          new Date('2026-08-19T15:00:00.000Z'),
          ownerId,
        ),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('allows update that only overlaps with itself', async () => {
    const employee = await setupEmployee();
    const shift = await createHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        ownerId,
      ),
    );

    const newStart = new Date('2026-08-19T10:00:00.000Z');
    const newEnd = new Date('2026-08-19T16:00:00.000Z');

    const result = await updateHandler.execute(
      new UpdateShiftCommand(shift.id, newStart, newEnd, ownerId),
    );

    expect(result.startTime).toEqual(newStart);
    expect(result.endTime).toEqual(newEnd);
  });
});
