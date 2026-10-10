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
import { App } from 'supertest/types';
import { getAccessToken } from 'test/utils/get-access-token';

type TaskCheckResponseBody = {
  id: string;
  taskId: string;
  employeeId: string;
  day: string;
  checkedAt: string;
};

describe('TaskCheckController POST E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurantsRepository: RestaurantsRepository;
  let employeesRepository: EmployeesRepository;

  // The other test files delete restaurants without deleting task lists first,
  // so this file must not leave any task list in the database.
  const cleanDatabase = async () => {
    await prisma.taskCheck.deleteMany();
    await prisma.taskList.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  };

  const createEmployeeWithTask = async (requiresValidation: boolean) => {
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
    const taskList = await prisma.taskList.create({
      data: { name: 'Ouverture', restaurantId: restaurant.id },
    });
    const task = await prisma.task.create({
      data: {
        label: 'Allumer la machine à café',
        taskListId: taskList.id,
        requiresValidation,
      },
    });
    const accessToken = await getAccessToken(
      'alice@test.com',
      'password123',
      app,
    );

    return { employee, task, accessToken };
  };

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
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  it('POST /tasks/:taskId/check records the check', async () => {
    const { employee, task, accessToken } = await createEmployeeWithTask(true);

    const response = await request(app.getHttpServer())
      .post(`/tasks/${task.id}/check`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const taskCheck = response.body as TaskCheckResponseBody;
    expect(taskCheck.taskId).toBe(task.id);
    expect(taskCheck.employeeId).toBe(employee.id);

    const checksInDb = await prisma.taskCheck.findMany();
    expect(checksInDb).toHaveLength(1);
    expect(checksInDb[0].id).toBe(taskCheck.id);
  });

  it('POST /tasks/:taskId/check rejects a second check on the same day', async () => {
    const { task, accessToken } = await createEmployeeWithTask(true);

    await request(app.getHttpServer())
      .post(`/tasks/${task.id}/check`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/tasks/${task.id}/check`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);

    expect(await prisma.taskCheck.count()).toBe(1);
  });

  it('POST /tasks/:taskId/check rejects a task that does not require validation', async () => {
    const { task, accessToken } = await createEmployeeWithTask(false);

    await request(app.getHttpServer())
      .post(`/tasks/${task.id}/check`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);

    expect(await prisma.taskCheck.count()).toBe(0);
  });
});
