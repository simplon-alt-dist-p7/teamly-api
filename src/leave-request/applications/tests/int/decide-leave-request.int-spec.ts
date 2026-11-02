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
import { ApproveLeaveRequestCommand } from 'src/leave-request/applications/use-cases/commands/approve-leave-request/approve-leave-request.command';
import { ApproveLeaveRequestHandler } from 'src/leave-request/applications/use-cases/commands/approve-leave-request/approve-leave-request.handler';
import { CreateLeaveRequestCommand } from 'src/leave-request/applications/use-cases/commands/create-leave-request/create-leave-request.command';
import { CreateLeaveRequestHandler } from 'src/leave-request/applications/use-cases/commands/create-leave-request/create-leave-request.handler';
import { RejectLeaveRequestCommand } from 'src/leave-request/applications/use-cases/commands/reject-leave-request/reject-leave-request.command';
import { RejectLeaveRequestHandler } from 'src/leave-request/applications/use-cases/commands/reject-leave-request/reject-leave-request.handler';
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

describe('Decide a leave request Integration', () => {
  let createHandler: CreateLeaveRequestHandler;
  let approveHandler: ApproveLeaveRequestHandler;
  let rejectHandler: RejectLeaveRequestHandler;
  let employeeService: EmployeeService;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurants: RestaurantsRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [CqrsModule, AuthModule, RestaurantModule, PrismaModule],
      providers: [
        CreateLeaveRequestHandler,
        ApproveLeaveRequestHandler,
        RejectLeaveRequestHandler,
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
    approveHandler = module.get(ApproveLeaveRequestHandler);
    rejectHandler = module.get(RejectLeaveRequestHandler);
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

  async function setupPendingRequest() {
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
    const leaveRequest = await createHandler.execute(
      new CreateLeaveRequestCommand(karim.userId, day(10), day(13)),
    );
    return { owner, leaveRequest };
  }

  it('saves the approval in the database', async () => {
    const { owner, leaveRequest } = await setupPendingRequest();

    await approveHandler.execute(
      new ApproveLeaveRequestCommand(leaveRequest.id, owner.id),
    );

    const row = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequest.id },
    });
    expect(row?.status).toBe('APPROVED');
    expect(row?.managerNote).toBeNull();
  });

  it('saves the rejection and the manager note in the database', async () => {
    const { owner, leaveRequest } = await setupPendingRequest();

    await rejectHandler.execute(
      new RejectLeaveRequestCommand(
        leaveRequest.id,
        owner.id,
        'Tu peux prendre la semaine suivante ?',
      ),
    );

    const row = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequest.id },
    });
    expect(row?.status).toBe('REJECTED');
    expect(row?.managerNote).toBe('Tu peux prendre la semaine suivante ?');
  });
});
