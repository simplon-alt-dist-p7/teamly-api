import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { TaskListsInMemoryRepository } from 'src/task/data-access/adapters/task-lists-in-memory.repository';
import { TASK_LISTS_REPOSITORY } from 'src/task/data-access/task-lists.repository';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { Task } from 'src/task/domain/models/task.entity';
import { RemoveTaskCommand } from '../../use-cases/commands/remove-task/remove-task.command';
import { RemoveTaskHandler } from '../../use-cases/commands/remove-task/remove-task.handler';

describe('RemoveTaskHandler', () => {
  let handler: RemoveTaskHandler;
  let taskListsRepository: TaskListsInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemoveTaskHandler,
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

    handler = module.get(RemoveTaskHandler);
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

  const createRestaurantWithTaskList = async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );
    await taskListsRepository.save(
      new TaskList({
        id: 'list-1',
        restaurantId: restaurant.id,
        name: 'Ouverture',
        tasks: [
          new Task({
            id: 'task-1',
            taskListId: 'list-1',
            label: 'Allumer la machine à café',
            requiresValidation: false,
          }),
        ],
      }),
    );

    return restaurant;
  };

  it('removes the task from the list when everything is valid', async () => {
    const restaurant = await createRestaurantWithTaskList();

    await handler.execute(
      new RemoveTaskCommand({
        restaurantId: restaurant.id,
        taskListId: 'list-1',
        taskId: 'task-1',
        ownerId,
      }),
    );

    expect(taskListsRepository.taskLists[0].tasks).toEqual([]);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    const command = new RemoveTaskCommand({
      restaurantId: 'unknown-restaurant',
      taskListId: 'list-1',
      taskId: 'task-1',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await createRestaurantWithTaskList();

    const command = new RemoveTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'list-1',
      taskId: 'task-1',
      ownerId: 'someone-else',
    });

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(taskListsRepository.taskLists[0].tasks).toHaveLength(1);
  });

  it('throws NotFoundException if the task list does not exist', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );

    const command = new RemoveTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'unknown-list',
      taskId: 'task-1',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if the task list belongs to another restaurant', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );
    const otherRestaurant = await restaurantsRepository.create(
      validRestaurantData,
      'owner-2',
    );
    await taskListsRepository.save(
      new TaskList({
        id: 'list-2',
        restaurantId: otherRestaurant.id,
        name: 'Fermeture',
        tasks: [
          new Task({
            id: 'task-2',
            taskListId: 'list-2',
            label: 'Sortir les poubelles',
            requiresValidation: false,
          }),
        ],
      }),
    );

    const command = new RemoveTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'list-2',
      taskId: 'task-2',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(taskListsRepository.taskLists[0].tasks).toHaveLength(1);
  });

  it('throws NotFoundException if the task is not in this list', async () => {
    const restaurant = await createRestaurantWithTaskList();
    await taskListsRepository.save(
      new TaskList({
        id: 'list-2',
        restaurantId: restaurant.id,
        name: 'Fermeture',
        tasks: [
          new Task({
            id: 'task-2',
            taskListId: 'list-2',
            label: 'Sortir les poubelles',
            requiresValidation: false,
          }),
        ],
      }),
    );

    const command = new RemoveTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'list-1',
      taskId: 'task-2',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(taskListsRepository.taskLists[1].tasks).toHaveLength(1);
  });
});
