import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
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
import { UpdateShiftCommand } from 'src/shift/applications/use-cases/commands/update-shift/update-shift.command';
import { UpdateShiftHandler } from 'src/shift/applications/use-cases/commands/update-shift/update-shift.handler';
import { ShiftsPrismaRepository } from 'src/shift/data-access/adapters/shifts-prisma.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { GetShiftsByRestaurantHandler } from '../../use-cases/queries/get-shifts-by-restaurant-id.handler';
import { GetShiftsByRestaurantQuery } from '../../use-cases/queries/get-shifts-by-restaurant-id.query';

describe('UpdateShiftHandler Integration', () => {
  let updateHandler: UpdateShiftHandler;
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
        UpdateShiftHandler,
        CreateShiftHandler,
        GetShiftsByRestaurantHandler,
        EmployeeService,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsPrismaRepository },
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    await module.init();

    updateHandler = module.get(UpdateShiftHandler);
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
      updateHandler.execute(
        new UpdateShiftCommand(
          '00000000-0000-0000-0000-000000000000',
          new Date('2026-08-19T10:00:00.000Z'),
          new Date('2026-08-19T18:00:00.000Z'),
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
      updateHandler.execute(
        new UpdateShiftCommand(
          shift.id,
          new Date('2026-08-19T10:00:00.000Z'),
          new Date('2026-08-19T18:00:00.000Z'),
          otherOwner.id,
        ),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('updates the shift when everything is valid', async () => {
    const { owner, restaurant, employee } = await setupOwnerAndEmployee();

    const shift = await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        owner.id,
      ),
    );

    const newStart = new Date('2026-08-19T10:00:00.000Z');
    const newEnd = new Date('2026-08-19T18:00:00.000Z');

    await updateHandler.execute(
      new UpdateShiftCommand(shift.id, newStart, newEnd, owner.id),
    );

    const shifts = await getShiftsHandler.execute(
      new GetShiftsByRestaurantQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(shifts).toHaveLength(1);
    expect(shifts[0].id).toBe(shift.id);
    expect(shifts[0].startTime).toEqual(newStart);
    expect(shifts[0].endTime).toEqual(newEnd);
  });

  it('throws ConflictException if update overlaps another shift', async () => {
    const { owner, employee } = await setupOwnerAndEmployee();

    const morning = await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T12:00:00.000Z'),
        owner.id,
      ),
    );

    await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T14:00:00.000Z'),
        new Date('2026-08-19T18:00:00.000Z'),
        owner.id,
      ),
    );

    await expect(
      updateHandler.execute(
        new UpdateShiftCommand(
          morning.id,
          new Date('2026-08-19T09:00:00.000Z'),
          new Date('2026-08-19T15:00:00.000Z'),
          owner.id,
        ),
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('allows update that only overlaps with itself', async () => {
    const { owner, restaurant, employee } = await setupOwnerAndEmployee();

    const shift = await createShiftHandler.execute(
      new CreateShiftCommand(
        employee.id,
        new Date('2026-08-19T09:00:00.000Z'),
        new Date('2026-08-19T17:00:00.000Z'),
        owner.id,
      ),
    );

    const newStart = new Date('2026-08-19T10:00:00.000Z');
    const newEnd = new Date('2026-08-19T16:00:00.000Z');

    await updateHandler.execute(
      new UpdateShiftCommand(shift.id, newStart, newEnd, owner.id),
    );

    const shifts = await getShiftsHandler.execute(
      new GetShiftsByRestaurantQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(shifts).toHaveLength(1);
    expect(shifts[0].startTime).toEqual(newStart);
    expect(shifts[0].endTime).toEqual(newEnd);
  });
});
