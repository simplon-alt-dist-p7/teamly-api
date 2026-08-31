import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { AuthService } from 'src/auth/auth.service';
import {
  EMPLOYEES_REPOSITORY,
  EmployeesRepository,
} from 'src/employee/data-access/employees.repository';
import {
  RESTAURANTS_REPOSITORY,
  RestaurantsRepository,
} from 'src/restaurant/data-access/restaurants.repository';
import request from 'supertest';
import { getAccessToken } from 'test/utils/get-access-token';

type ShiftResponseBody = {
  id: string;
  employeeId: string;
  timeRange: { startTime: string; endTime: string };
};

describe('ShiftController E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurantsRepository: RestaurantsRepository;
  let employeesRepository: EmployeesRepository;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = module.get(PrismaService);
    authService = module.get(AuthService);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
  });

  beforeEach(async () => {
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /employees/:employeeId/shifts creates a shift', async () => {
    const owner = await authService.createUser({
      email: 'owner@test.com',
      password: 'password123',
      role: Role.OWNER,
    });
    const restaurant = await restaurantsRepository.create(
      {
        name: 'Le Bistrot',
        address: '10 rue de Paris',
        phone: '+33612345678',
        email: 'contact@test.com',
      },
      owner.id,
    );

    const employeeUser = await authService.createUser({
      email: 'alice@test.com',
      password: 'password123',
      role: Role.EMPLOYEE,
    });
    const employee = await employeesRepository.create({
      userId: employeeUser.id,
      restaurantId: restaurant.id,
      firstName: 'Alice',
      lastName: 'Martin',
    });

    const accessToken = await getAccessToken(
      'owner@test.com',
      'password123',
      app,
    );

    const response = await request(app.getHttpServer())
      .post(`/employees/${employee.id}/shifts`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        startTime: '2026-08-19T09:00:00.000Z',
        endTime: '2026-08-19T17:00:00.000Z',
      })
      .expect(201);

    const shift = response.body as ShiftResponseBody;
    expect(shift.employeeId).toBe(employee.id);

    const shiftsInDb = await prisma.shift.findMany();
    expect(shiftsInDb).toHaveLength(1);
  });
});
