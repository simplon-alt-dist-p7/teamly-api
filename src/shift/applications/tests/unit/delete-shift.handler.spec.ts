import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { ShiftsInMemoryRepository } from 'src/shift/data-access/adapters/shifts-in-memory.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { CreateShiftCommand } from '../../use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from '../../use-cases/commands/create-shift/create-shift.handler';
import { DeleteShiftCommand } from '../../use-cases/commands/delete-shift/delete-shift.command';
import { DeleteShiftHandler } from '../../use-cases/commands/delete-shift/delete-shift.handler';

describe('DeleteShiftHandler', () => {
  let deleteHandler: DeleteShiftHandler;
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
        DeleteShiftHandler,
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

    deleteHandler = module.get(DeleteShiftHandler);
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
    return employeesRepository.create({
      userId: 'user-1',
      restaurantId: restaurant.id,
      firstName: 'Alice',
      lastName: 'Martin',
    });
  }

  it('throws NotFoundException if shift does not exist', async () => {
    await expect(
      deleteHandler.execute(new DeleteShiftCommand('unknown-shift', ownerId)),
    ).rejects.toThrow(NotFoundException);
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

    await expect(
      deleteHandler.execute(new DeleteShiftCommand(shift.id, 'someone-else')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deletes the shift when everything is valid', async () => {
    const employee = await setupEmployee();
    const shift = await createHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        ownerId,
      ),
    );

    await deleteHandler.execute(new DeleteShiftCommand(shift.id, ownerId));

    expect(shiftsRepository.shifts).toHaveLength(0);
  });
});
