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
import { GetMyLeaveRequestsHandler } from 'src/leave-request/applications/use-cases/queries/get-my-leave-requests.handler';
import { GetMyLeaveRequestsQuery } from 'src/leave-request/applications/use-cases/queries/get-my-leave-requests.query';
import { GetTeamLeaveRequestsHandler } from 'src/leave-request/applications/use-cases/queries/get-team-leave-requests.handler';
import { GetTeamLeaveRequestsQuery } from 'src/leave-request/applications/use-cases/queries/get-team-leave-requests.query';
import { LeaveRequestsPrismaRepository } from 'src/leave-request/data-access/adapters/leave-requests-prisma.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import {
  RESTAURANTS_REPOSITORY,
  RestaurantsRepository,
} from 'src/restaurant/data-access/restaurants.repository';
import { RestaurantModule } from 'src/restaurant/restaurant.module';

function day(offset: number): Date {
  return new Date(format(addDays(new Date(), offset), 'yyyy-MM-dd'));
}

describe('Get leave requests Integration', () => {
  let createHandler: CreateLeaveRequestHandler;
  let getMineHandler: GetMyLeaveRequestsHandler;
  let getTeamHandler: GetTeamLeaveRequestsHandler;
  let employeeService: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CqrsModule, AuthModule, RestaurantModule, PrismaModule],
      providers: [
        CreateLeaveRequestHandler,
        GetMyLeaveRequestsHandler,
        GetTeamLeaveRequestsHandler,
        EmployeeService,
        {
          provide: LEAVE_REQUEST_REPOSITORY,
          useClass: LeaveRequestsPrismaRepository,
        },
        { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
      ],
    }).compile();

    await module.init();

    createHandler = module.get(CreateLeaveRequestHandler);
    getMineHandler = module.get(GetMyLeaveRequestsHandler);
    getTeamHandler = module.get(GetTeamLeaveRequestsHandler);
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

  async function setupTeam() {
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
    const ines = await employeeService.createEmployee(
      restaurant.id,
      {
        email: 'ines@test.com',
        password: 'secret123',
        firstName: 'Inès',
        lastName: 'Haddad',
      },
      owner.id,
    );
    return { owner, restaurant, karim, ines };
  }

  it('returns the requests of the logged-in employee only', async () => {
    const { karim, ines } = await setupTeam();
    await createHandler.execute(
      new CreateLeaveRequestCommand(karim.userId, day(10), day(13)),
    );
    await createHandler.execute(
      new CreateLeaveRequestCommand(ines.userId, day(11), day(11)),
    );

    const result = await getMineHandler.execute(
      new GetMyLeaveRequestsQuery(karim.userId),
    );

    expect(result).toHaveLength(1);
    expect(result[0].employeeId).toBe(karim.id);
    expect(result[0].startDate).toEqual(day(10));
  });

  it('returns the team requests with names, most recent first', async () => {
    const { owner, restaurant, karim, ines } = await setupTeam();
    const karimRequest = await createHandler.execute(
      new CreateLeaveRequestCommand(karim.userId, day(30), day(32)),
    );
    await createHandler.execute(
      new CreateLeaveRequestCommand(ines.userId, day(5), day(5)),
    );
    await prisma.leaveRequest.update({
      where: { id: karimRequest.id },
      data: { status: 'APPROVED' },
    });

    const result = await getTeamHandler.execute(
      new GetTeamLeaveRequestsQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(result.map((r) => [r.firstName, r.status])).toEqual([
      ['Karim', 'APPROVED'],
      ['Inès', 'PENDING'],
    ]);
  });

  it('returns old requests too', async () => {
    const { owner, restaurant, karim } = await setupTeam();
    await prisma.leaveRequest.create({
      data: {
        employeeId: karim.id,
        startDate: day(-130),
        endDate: day(-128),
        status: 'APPROVED',
      },
    });

    const result = await getTeamHandler.execute(
      new GetTeamLeaveRequestsQuery({
        restaurantId: restaurant.id,
        ownerId: owner.id,
      }),
    );

    expect(result).toHaveLength(1);
  });
});
