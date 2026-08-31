import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
import { GetShiftsByRestaurantHandler } from 'src/shift/applications/use-cases/queries/get-shifts-by-restaurant-id.handler';
import { GetShiftsByRestaurantQuery } from 'src/shift/applications/use-cases/queries/get-shifts-by-restaurant-id.query';
import { ShiftsPrismaRepository } from 'src/shift/data-access/adapters/shifts-prisma.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';

describe('GetShiftsByRestaurantHandler Integration', () => {
  let handler: GetShiftsByRestaurantHandler;
  let createShiftHandler: CreateShiftHandler;
  let employeeService: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule, RestaurantModule, PrismaModule],
      providers: [
        GetShiftsByRestaurantHandler,
        CreateShiftHandler,
        EmployeeService,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsPrismaRepository },
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    handler = module.get(GetShiftsByRestaurantHandler);
    createShiftHandler = module.get(CreateShiftHandler);
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

  async function createShift(
    employeeId: string,
    ownerId: string,
    startTime: Date,
    endTime: Date,
  ) {
    return createShiftHandler.execute(
      new CreateShiftCommand(employeeId, startTime, endTime, ownerId),
    );
  }

  it('returns all shifts for the given restaurant', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const otherOwner = await authService.createUser({
      email: 'otherOwner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const restaurant = await restaurants.create(restaurantData, owner.id);

    const otherRestaurant = await restaurants.create(
      { ...restaurantData, email: 'other@test.com', name: 'Autre resto' },
      otherOwner.id,
    );

    const employee1 = await employeeService.createEmployee(
      restaurant.id,
      { ...employeeDto, email: 'employee1@test.com' },
      owner.id,
    );

    const employee2 = await employeeService.createEmployee(
      restaurant.id,
      { ...employeeDto, email: 'employee2@test.com', firstName: 'Bob' },
      owner.id,
    );

    const otherEmployee = await employeeService.createEmployee(
      otherRestaurant.id,
      { ...employeeDto, email: 'other@test.com' },
      otherOwner.id,
    );

    await createShift(
      employee1.id,
      owner.id,
      new Date('2026-08-19T09:00:00.000Z'),
      new Date('2026-08-19T17:00:00.000Z'),
    );

    await createShift(
      employee2.id,
      owner.id,
      new Date('2026-08-20T09:00:00.000Z'),
      new Date('2026-08-20T17:00:00.000Z'),
    );

    await createShift(
      otherEmployee.id,
      otherOwner.id,
      new Date('2026-08-19T09:00:00.000Z'),
      new Date('2026-08-19T17:00:00.000Z'),
    );

    const shifts = await handler.execute(
      new GetShiftsByRestaurantQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(shifts).toHaveLength(2);
    expect(
      shifts.every((shift) =>
        [employee1.id, employee2.id].includes(shift.employeeId),
      ),
    ).toBe(true);
  });

  it('throws ForbiddenException when requester is not the restaurant owner', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const otherOwner = await authService.createUser({
      email: 'otherOwner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const restaurant = await restaurants.create(restaurantData, owner.id);

    await expect(
      handler.execute(
        new GetShiftsByRestaurantQuery({
          restaurantId: restaurant.id,
          ownerId: otherOwner.id,
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws NotFoundException when restaurant does not exist', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    await expect(
      handler.execute(
        new GetShiftsByRestaurantQuery({
          restaurantId: '00000000-0000-0000-0000-000000000000',
          ownerId: owner.id,
        }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns empty array when restaurant has no shifts', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    const restaurant = await restaurants.create(restaurantData, owner.id);

    const shifts = await handler.execute(
      new GetShiftsByRestaurantQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(shifts).toHaveLength(0);
  });
});
