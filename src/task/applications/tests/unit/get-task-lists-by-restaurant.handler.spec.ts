import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { TaskListsInMemoryRepository } from 'src/task/data-access/adapters/task-lists-in-memory.repository';
import { TASK_LISTS_REPOSITORY } from 'src/task/data-access/task-lists.repository';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { GetTaskListsByRestaurantHandler } from '../../use-cases/queries/get-task-lists-by-restaurant.handler';
import { GetTaskListsByRestaurantQuery } from '../../use-cases/queries/get-task-lists-by-restaurant.query';

describe('GetTaskListsByRestaurantHandler', () => {
  let handler: GetTaskListsByRestaurantHandler;
  let taskListsRepository: TaskListsInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTaskListsByRestaurantHandler,
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

    handler = module.get(GetTaskListsByRestaurantHandler);
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

  it('returns only the task lists of the restaurant', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );
    const otherRestaurant = await restaurantsRepository.create(
      validRestaurantData,
      'owner-2',
    );
    const opening = new TaskList({
      id: 'list-1',
      restaurantId: restaurant.id,
      name: 'Ouverture',
      tasks: [],
    });
    const closing = new TaskList({
      id: 'list-2',
      restaurantId: otherRestaurant.id,
      name: 'Fermeture',
      tasks: [],
    });
    await taskListsRepository.save(opening);
    await taskListsRepository.save(closing);

    const result = await handler.execute(
      new GetTaskListsByRestaurantQuery({
        restaurantId: restaurant.id,
        ownerId,
      }),
    );

    expect(result).toEqual([opening]);
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    const query = new GetTaskListsByRestaurantQuery({
      restaurantId: 'unknown-restaurant',
      ownerId,
    });

    await expect(handler.execute(query)).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if requester is not the restaurant owner', async () => {
    const restaurant = await restaurantsRepository.create(
      validRestaurantData,
      ownerId,
    );

    const query = new GetTaskListsByRestaurantQuery({
      restaurantId: restaurant.id,
      ownerId: 'someone-else',
    });

    await expect(handler.execute(query)).rejects.toThrow(ForbiddenException);
  });
});
