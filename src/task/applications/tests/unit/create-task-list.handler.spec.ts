import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { TaskListsInMemoryRepository } from 'src/task/data-access/adapters/task-lists-in-memory.repository';
import { TASK_LISTS_REPOSITORY } from 'src/task/data-access/task-lists.repository';
import { CreateTaskListCommand } from '../../use-cases/commands/create-task-list/create-task-list.command';
import { CreateTaskListHandler } from '../../use-cases/commands/create-task-list/create-task-list.handler';

describe('CreateTaskListHandler', () => {
  let handler: CreateTaskListHandler;
  let taskListsRepository: TaskListsInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateTaskListHandler,
        {
          provide: TASK_LISTS_REPOSITORY,
          useClass: TaskListsInMemoryRepository,
        },
        {
          provide: RESTAURANTS_REPOSITORY,
          useClass: RestaurantsInMemoryRepository,
        },
      ],
    }).compile();

    handler = module.get(CreateTaskListHandler);
    taskListsRepository = module.get(TASK_LISTS_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
  });

  const ownerId = 'owner-1';

  const validRestaurantData = {
    name: 'Le Bistrot',
    address: '10 rue de Paris',
    phone: '+33612345678',
    email: 'contact@test.com',
  };

  it('creates the task list when everything is valid', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );

    const result = await handler.execute(
      new CreateTaskListCommand({
        restaurantId: restaurant.id,
        name: 'Ouverture',
        ownerId,
      }),
    );

    expect(result.restaurantId).toBe(restaurant.id);
    expect(result.name).toBe('Ouverture');
    expect(result.tasks).toEqual([]);
    expect(taskListsRepository.taskLists).toEqual([result]);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    const command = new CreateTaskListCommand({
      restaurantId: 'unknown-restaurant',
      name: 'Ouverture',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(taskListsRepository.taskLists).toHaveLength(0);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );

    const command = new CreateTaskListCommand({
      restaurantId: restaurant.id,
      name: 'Ouverture',
      ownerId: 'someone-else',
    });

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(taskListsRepository.taskLists).toHaveLength(0);
  });

  it('throws BadRequestException when the name is blank', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );

    const command = new CreateTaskListCommand({
      restaurantId: restaurant.id,
      name: '   ',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    expect(taskListsRepository.taskLists).toHaveLength(0);
  });
});
