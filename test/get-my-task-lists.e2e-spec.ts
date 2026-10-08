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

type MyTaskListResponseBody = {
  id: string;
  restaurantId: string;
  name: string;
  tasks: { id: string; taskListId: string; label: string }[];
};

describe('MyTaskListsController GET E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurantsRepository: RestaurantsRepository;
  let employeesRepository: EmployeesRepository;

  // The other test files delete restaurants without deleting task lists first,
  // so this file must not leave any task list in the database.
  const cleanDatabase = async () => {
    await prisma.taskList.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  };

  const createRestaurant = async (ownerEmail: string) => {
    const owner = await authService.createUser({
      email: ownerEmail,
      password: 'password123',
      role: Role.OWNER,
    });
    return restaurantsRepository.create(
      {
        name: 'Le Bistrot',
        address: '10 rue de Paris',
        phone: '+33612345678',
        email: 'contact@test.com',
      },
      owner.id,
    );
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

  it('GET /task-lists/me returns the task lists of the employee restaurant', async () => {
    const restaurant = await createRestaurant('owner@test.com');
    const otherRestaurant = await createRestaurant('other-owner@test.com');
    const employeeUser = await authService.createUser({
      email: 'alice@test.com',
      password: 'password123',
      role: Role.EMPLOYEE,
    });
    await employeesRepository.create({
      userId: employeeUser.id,
      restaurantId: restaurant.id,
      firstName: 'Alice',
      lastName: 'Martin',
    });

    const taskList = await prisma.taskList.create({
      data: { name: 'Ouverture', restaurantId: restaurant.id },
    });
    await prisma.task.create({
      data: { label: 'Allumer la machine à café', taskListId: taskList.id },
    });
    await prisma.taskList.create({
      data: { name: 'Fermeture', restaurantId: otherRestaurant.id },
    });

    const accessToken = await getAccessToken(
      'alice@test.com',
      'password123',
      app,
    );

    const response = await request(app.getHttpServer())
      .get('/task-lists/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const taskLists = response.body as MyTaskListResponseBody[];
    expect(taskLists).toHaveLength(1);
    expect(taskLists[0].restaurantId).toBe(restaurant.id);
    expect(taskLists[0].name).toBe('Ouverture');
    expect(taskLists[0].tasks).toHaveLength(1);
    expect(taskLists[0].tasks[0].label).toBe('Allumer la machine à café');
  });

  it('GET /task-lists/me returns 404 when the user is not an employee', async () => {
    await createRestaurant('owner@test.com');
    const accessToken = await getAccessToken(
      'owner@test.com',
      'password123',
      app,
    );

    await request(app.getHttpServer())
      .get('/task-lists/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
