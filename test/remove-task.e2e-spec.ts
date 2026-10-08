import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AppModule } from 'src/app.module';
import { AuthService } from 'src/auth/auth.service';
import {
  RESTAURANTS_REPOSITORY,
  RestaurantsRepository,
} from 'src/restaurant/data-access/restaurants.repository';
import request from 'supertest';
import { App } from 'supertest/types';
import { getAccessToken } from 'test/utils/get-access-token';

describe('TaskListController remove task E2E', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let authService: AuthService;
  let restaurantsRepository: RestaurantsRepository;

  // The other test files delete restaurants without deleting task lists first,
  // so this file must not leave any task list in the database.
  const cleanDatabase = async () => {
    await prisma.taskList.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  };

  const createOwnerWithTask = async () => {
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
    const taskList = await prisma.taskList.create({
      data: { name: 'Ouverture', restaurantId: restaurant.id },
    });
    const task = await prisma.task.create({
      data: { label: 'Allumer la machine à café', taskListId: taskList.id },
    });
    const accessToken = await getAccessToken(
      'owner@test.com',
      'password123',
      app,
    );

    return { restaurant, taskList, task, accessToken };
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
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  it('DELETE /restaurant/:restaurantId/task-lists/:taskListId/tasks/:taskId removes the task', async () => {
    const { restaurant, taskList, task, accessToken } =
      await createOwnerWithTask();

    await request(app.getHttpServer())
      .delete(
        `/restaurant/${restaurant.id}/task-lists/${taskList.id}/tasks/${task.id}`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    expect(await prisma.task.count()).toBe(0);
    expect(await prisma.taskList.count()).toBe(1);
  });

  it('DELETE /restaurant/:restaurantId/task-lists/:taskListId/tasks/:taskId returns 404 for an unknown task', async () => {
    const { restaurant, taskList, accessToken } = await createOwnerWithTask();

    await request(app.getHttpServer())
      .delete(
        `/restaurant/${restaurant.id}/task-lists/${taskList.id}/tasks/unknown-task`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);

    expect(await prisma.task.count()).toBe(1);
  });
});
