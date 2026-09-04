import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { EmployeesPrismaRepository } from 'src/employee/data-access/adapters/employees-prisma.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { EmployeeService } from 'src/employee/employee.service';
import {
  RESTAURANTS_REPOSITORY,
  RestaurantsRepository,
} from 'src/restaurant/data-access/restaurants.repository';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { CreateShiftCommand } from 'src/shift/applications/use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from 'src/shift/applications/use-cases/commands/create-shift/create-shift.handler';
import { DeleteShiftCommand } from 'src/shift/applications/use-cases/commands/delete-shift/delete-shift.command';
import { DeleteShiftHandler } from 'src/shift/applications/use-cases/commands/delete-shift/delete-shift.handler';
import { ShiftsPrismaRepository } from 'src/shift/data-access/adapters/shifts-prisma.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { GetShiftsByRestaurantHandler } from '../../use-cases/queries/get-shifts-by-restaurant-id.handler';
import { GetShiftsByRestaurantQuery } from '../../use-cases/queries/get-shifts-by-restaurant-id.query';

describe('DeleteShiftHandler Integration', () => {
  let deleteHandler: DeleteShiftHandler;
  let createShiftHandler: CreateShiftHandler;
  let getShiftsHandler: GetShiftsByRestaurantHandler;
  let employeeService: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;

  const employeeDto = {
    email: 'alice@test.com',
    password: 'secret123',
    firstName: 'Alice',
    lastName: 'Martin',
  };

  const restaurantData = {
    name: 'Le Bistrot',
    email: 'contact@test.com',
    address: '10 rue de Paris',
    phone: '+33612345678',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CqrsModule, AuthModule, RestaurantModule, PrismaModule],
      providers: [
        DeleteShiftHandler,
        CreateShiftHandler,
        GetShiftsByRestaurantHandler,
        EmployeeService,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsPrismaRepository },
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    await module.init();

    deleteHandler = module.get(DeleteShiftHandler);
    createShiftHandler = module.get(CreateShiftHandler);
    getShiftsHandler = module.get(GetShiftsByRestaurantHandler);
    employeeService = module.get(EmployeeService);
    prisma = module.get(PrismaService);
    authService = module.get(AuthService);
    restaurants = module.get(RESTAURANTS_REPOSITORY);

    await prisma.$connect();
  });

  beforeEach(async () => {
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function setupOwnerAndEmployee() {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const restaurant = await restaurants.create(restaurantData, owner.id);
    const employee = await employeeService.createEmployee(
      restaurant.id,
      employeeDto,
      owner.id,
    );

    return { owner, restaurant, employee };
  }

  it('throws NotFoundException if shift does not exist', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    await expect(
      deleteHandler.execute(
        new DeleteShiftCommand(
          '00000000-0000-0000-0000-000000000000',
          owner.id,
        ),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const { owner, employee } = await setupOwnerAndEmployee();

    const shift = await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        owner.id,
      ),
    );

    const otherOwner = await authService.createUser({
      email: 'other@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    await expect(
      deleteHandler.execute(new DeleteShiftCommand(shift.id, otherOwner.id)),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deletes the shift when everything is valid', async () => {
    const { owner, restaurant, employee } = await setupOwnerAndEmployee();

    const shift = await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        owner.id,
      ),
    );

    await deleteHandler.execute(new DeleteShiftCommand(shift.id, owner.id));

    const shifts = await getShiftsHandler.execute(
      new GetShiftsByRestaurantQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(shifts).toHaveLength(0);
  });
});
