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
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { AddTaskCommand } from '../../use-cases/commands/add-task/add-task.command';
import { AddTaskHandler } from '../../use-cases/commands/add-task/add-task.handler';

describe('AddTaskHandler', () => {
  let handler: AddTaskHandler;
  let taskListsRepository: TaskListsInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddTaskHandler,
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

    handler = module.get(AddTaskHandler);
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
        tasks: [],
      }),
    );

    return restaurant;
  };

  it('adds the task to the list when everything is valid', async () => {
    const restaurant = await createRestaurantWithTaskList();

    const result = await handler.execute(
      new AddTaskCommand({
        restaurantId: restaurant.id,
        taskListId: 'list-1',
        label: 'Allumer la machine à café',
        ownerId,
      }),
    );

    expect(result.taskListId).toBe('list-1');
    expect(result.label).toBe('Allumer la machine à café');
    expect(taskListsRepository.taskLists[0].tasks).toEqual([result]);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    const command = new AddTaskCommand({
      restaurantId: 'unknown-restaurant',
      taskListId: 'list-1',
      label: 'Allumer la machine à café',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await createRestaurantWithTaskList();

    const command = new AddTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'list-1',
      label: 'Allumer la machine à café',
      ownerId: 'someone-else',
    });

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenException);
    expect(taskListsRepository.taskLists[0].tasks).toHaveLength(0);
  });

  it('throws NotFoundException if the task list does not exist', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );

    const command = new AddTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'unknown-list',
      label: 'Allumer la machine à café',
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
        tasks: [],
      }),
    );

    const command = new AddTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'list-2',
      label: 'Allumer la machine à café',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
    expect(taskListsRepository.taskLists[0].tasks).toHaveLength(0);
  });

  it('throws BadRequestException when the label is blank', async () => {
    const restaurant = await createRestaurantWithTaskList();

    const command = new AddTaskCommand({
      restaurantId: restaurant.id,
      taskListId: 'list-1',
      label: '   ',
      ownerId,
    });

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
    expect(taskListsRepository.taskLists[0].tasks).toHaveLength(0);
  });
});
