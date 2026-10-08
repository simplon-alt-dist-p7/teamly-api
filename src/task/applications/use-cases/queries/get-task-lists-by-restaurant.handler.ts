import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  TASK_LISTS_REPOSITORY,
  type TaskListsRepository,
} from 'src/task/data-access/task-lists.repository';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { GetTaskListsByRestaurantQuery } from './get-task-lists-by-restaurant.query';

@QueryHandler(GetTaskListsByRestaurantQuery)
export class GetTaskListsByRestaurantHandler implements IQueryHandler<
  GetTaskListsByRestaurantQuery,
  TaskList[]
> {
  constructor(
    @Inject(TASK_LISTS_REPOSITORY)
    private readonly taskListsRepository: TaskListsRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(query: GetTaskListsByRestaurantQuery): Promise<TaskList[]> {
    const { restaurantId, ownerId } = query.props;

    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    return this.taskListsRepository.findByRestaurantId(restaurantId);
  }
}
