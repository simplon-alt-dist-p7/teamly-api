import { ConflictException } from '@nestjs/common';
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
import { LeaveRequestsPrismaRepository } from 'src/leave-request/data-access/adapters/leave-requests-prisma.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import {
  RESTAURANTS_REPOSITORY,
  RestaurantsRepository,
} from 'src/restaurant/data-access/restaurants.repository';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { CreateShiftCommand } from 'src/shift/applications/use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from 'src/shift/applications/use-cases/commands/create-shift/create-shift.handler';
import { ShiftsPrismaRepository } from 'src/shift/data-access/adapters/shifts-prisma.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';

describe('Shifts during an approved leave Integration', () => {
  let createShiftHandler: CreateShiftHandler;
  let employeeService: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CqrsModule, AuthModule, RestaurantModule, PrismaModule],
      providers: [
        CreateShiftHandler,
        EmployeeService,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsPrismaRepository },
        {
          provide: LEAVE_REQUEST_REPOSITORY,
          useClass: LeaveRequestsPrismaRepository,
        },
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    await module.init();

    createShiftHandler = module.get(CreateShiftHandler);
    employeeService = module.get(EmployeeService);
    prisma = module.get(PrismaService);
    authService = module.get(AuthService);
    restaurants = module.get(RESTAURANTS_REPOSITORY);

    await prisma.$connect();
  });

  async function cleanDatabase() {
    await prisma.leaveRequest.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  }

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  async function setupKarimOnLeave(status: 'APPROVED' | 'PENDING') {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'secret123',
      role: Role.OWNER,
    });
    const restaurant = await restaurants.create(
      {
        name: 'Fratellino',
        email: 'contact@test.com',
        address: '10 rue de Paris',
        phone: '+33612345678',
      },
      owner.id,
    );
    const karim = await employeeService.createEmployee(
      restaurant.id,
      {
        email: 'karim@test.com',
        password: 'secret123',
        firstName: 'Karim',
        lastName: 'Benali',
      },
      owner.id,
    );
    await prisma.leaveRequest.create({
      data: {
        employeeId: karim.id,
        startDate: new Date('2026-08-24'),
        endDate: new Date('2026-08-26'),
        status,
      },
    });
    return { owner, karim };
  }

  it('refuses a shift during an approved leave saved in the database', async () => {
    const { owner, karim } = await setupKarimOnLeave('APPROVED');

    await expect(
      createShiftHandler.execute(
        new CreateShiftCommand(
          karim.id,
          new Date('2026-08-25T16:00:00.000Z'),
          new Date('2026-08-25T21:00:00.000Z'),
          owner.id,
        ),
      ),
    ).rejects.toThrow(ConflictException);
    expect(await prisma.shift.count()).toBe(0);
  });

  it('accepts a shift during a pending leave', async () => {
    const { owner, karim } = await setupKarimOnLeave('PENDING');

    await createShiftHandler.execute(
      new CreateShiftCommand(
        karim.id,
        new Date('2026-08-25T16:00:00.000Z'),
        new Date('2026-08-25T21:00:00.000Z'),
        owner.id,
      ),
    );

    expect(await prisma.shift.count()).toBe(1);
  });
});
