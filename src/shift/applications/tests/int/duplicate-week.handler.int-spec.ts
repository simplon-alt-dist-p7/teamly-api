import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { addDays } from 'date-fns';
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
import { DuplicateWeekCommand } from 'src/shift/applications/use-cases/commands/duplicate-week/duplicate-shift.command';
import { DuplicateWeekHandler } from 'src/shift/applications/use-cases/commands/duplicate-week/duplicate-shift.handler';
import { ShiftsPrismaRepository } from 'src/shift/data-access/adapters/shifts-prisma.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { GetShiftsByRestaurantHandler } from '../../use-cases/queries/get-shifts-by-restaurant-id.handler';
import { GetShiftsByRestaurantQuery } from '../../use-cases/queries/get-shifts-by-restaurant-id.query';

describe('DuplicateWeekHandler Integration', () => {
  let handler: DuplicateWeekHandler;
  let createShiftHandler: CreateShiftHandler;
  let employeeService: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;
  let getShiftsHandler: GetShiftsByRestaurantHandler;

  const referenceDate = new Date('2026-08-19T12:00:00.000Z');
  const shiftStart = new Date('2026-08-19T09:00:00.000Z');
  const shiftEnd = new Date('2026-08-19T17:00:00.000Z');

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
        DuplicateWeekHandler,
        CreateShiftHandler,
        GetShiftsByRestaurantHandler,
        EmployeeService,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsPrismaRepository },
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    await module.init();

    handler = module.get(DuplicateWeekHandler);
    createShiftHandler = module.get(CreateShiftHandler);
    employeeService = module.get(EmployeeService);
    prisma = module.get(PrismaService);
    authService = module.get(AuthService);
    restaurants = module.get(RESTAURANTS_REPOSITORY);
    getShiftsHandler = module.get(GetShiftsByRestaurantHandler);

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

  it('throws NotFoundException when restaurant does not exist', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });

    await expect(
      handler.execute(
        new DuplicateWeekCommand({
          restaurantId: '00000000-0000-0000-0000-000000000000',
          referenceDate,
          ownerId: owner.id,
        }),
      ),
    ).rejects.toThrow(NotFoundException);
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
        new DuplicateWeekCommand({
          restaurantId: restaurant.id,
          referenceDate,
          ownerId: otherOwner.id,
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('duplicates week shifts to +7 days in the database', async () => {
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

    await createShiftHandler.execute(
      new CreateShiftCommand(employee.id, shiftStart, shiftEnd, owner.id),
    );

    expect(await prisma.shift.count()).toBe(1);

    await handler.execute(
      new DuplicateWeekCommand({
        restaurantId: restaurant.id,
        referenceDate,
        ownerId: owner.id,
      }),
    );

    const shifts = await prisma.shift.findMany({
      orderBy: { startTime: 'asc' },
    });

    expect(shifts).toHaveLength(2);
    expect(shifts[1].employeeId).toBe(employee.id);
    expect(shifts[1].startTime.getTime()).toBe(
      addDays(shiftStart, 7).getTime(),
    );
    expect(shifts[1].endTime.getTime()).toBe(addDays(shiftEnd, 7).getTime());
  });

  it('skips when the target week already has an overlapping shift', async () => {
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

    await createShiftHandler.execute(
      new CreateShiftCommand(employee.id, shiftStart, shiftEnd, owner.id),
    );
    await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        addDays(shiftStart, 7),
        addDays(shiftEnd, 7),
        owner.id,
      ),
    );

    await handler.execute(
      new DuplicateWeekCommand({
        restaurantId: restaurant.id,
        referenceDate,
        ownerId: owner.id,
      }),
    );

    const shifts = await getShiftsHandler.execute(
      new GetShiftsByRestaurantQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(shifts).toHaveLength(2);
    expect(shifts[1].startTime.getTime()).toBe(
      addDays(shiftStart, 7).getTime(),
    );
  });
});
