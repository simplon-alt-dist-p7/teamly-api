import { ConflictException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { addDays, format } from 'date-fns';
import { PrismaModule } from 'prisma/prisma.module';
import { PrismaService } from 'prisma/prisma.service';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';
import { EmployeesPrismaRepository } from 'src/employee/data-access/adapters/employees-prisma.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { EmployeeService } from 'src/employee/employee.service';
import { CreateLeaveRequestCommand } from 'src/leave-request/applications/use-cases/commands/create-leave-request/create-leave-request.command';
import { CreateLeaveRequestHandler } from 'src/leave-request/applications/use-cases/commands/create-leave-request/create-leave-request.handler';
import { LeaveRequestsPrismaRepository } from 'src/leave-request/data-access/adapters/leave-requests-prisma.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import {
  RESTAURANTS_REPOSITORY,
  RestaurantsRepository,
} from 'src/restaurant/data-access/restaurants.repository';
import { RestaurantModule } from 'src/restaurant/restaurant.module';

// Un jour à partir d'aujourd'hui, au format envoyé par le front ("2026-11-12").
function day(offset: number): Date {
  return new Date(format(addDays(new Date(), offset), 'yyyy-MM-dd'));
}

describe('CreateLeaveRequestHandler Integration', () => {
  let handler: CreateLeaveRequestHandler;
  let employeeService: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;

  const employeeDto = {
    email: 'karim@test.com',
    password: 'secret123',
    firstName: 'Karim',
    lastName: 'Benali',
  };

  const restaurantData = {
    name: 'Fratellino',
    email: 'contact@test.com',
    address: '10 rue de Paris',
    phone: '+33612345678',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CqrsModule, AuthModule, RestaurantModule, PrismaModule],
      providers: [
        CreateLeaveRequestHandler,
        EmployeeService,
        {
          provide: LEAVE_REQUEST_REPOSITORY,
          useClass: LeaveRequestsPrismaRepository,
        },
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    await module.init();

    handler = module.get(CreateLeaveRequestHandler);
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

  // Les autres tests suppriment les employés : on ne laisse pas de congé qui les bloquerait.
  afterAll(async () => {
    await cleanDatabase();
    await prisma.$disconnect();
  });

  async function setupEmployee() {
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
    return employee;
  }

  it('saves a pending leave request in the database', async () => {
    const employee = await setupEmployee();

    const created = await handler.execute(
      new CreateLeaveRequestCommand(employee.userId, day(11), day(14)),
    );

    const row = await prisma.leaveRequest.findUnique({
      where: { id: created.id },
    });
    expect(row).not.toBeNull();
    expect(row?.employeeId).toBe(employee.id);
    expect(row?.status).toBe('PENDING');
    expect(row?.startDate).toEqual(day(11));
    expect(row?.endDate).toEqual(day(14));
    expect(row?.createdAt).toBeInstanceOf(Date);
  });

  it('throws ConflictException if the dates overlap a request already saved', async () => {
    const employee = await setupEmployee();
    await handler.execute(
      new CreateLeaveRequestCommand(employee.userId, day(11), day(14)),
    );

    await expect(
      handler.execute(
        new CreateLeaveRequestCommand(employee.userId, day(13), day(20)),
      ),
    ).rejects.toThrow(ConflictException);

    expect(await prisma.leaveRequest.count()).toBe(1);
  });

  it('allows new dates over a rejected request', async () => {
    const employee = await setupEmployee();
    const first = await handler.execute(
      new CreateLeaveRequestCommand(employee.userId, day(11), day(14)),
    );
    await prisma.leaveRequest.update({
      where: { id: first.id },
      data: { status: 'REJECTED' },
    });

    await handler.execute(
      new CreateLeaveRequestCommand(employee.userId, day(11), day(14)),
    );

    expect(await prisma.leaveRequest.count()).toBe(2);
  });
});
