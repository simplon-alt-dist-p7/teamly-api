import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  TASK_LISTS_REPOSITORY,
  type TaskListsRepository,
} from 'src/task/data-access/task-lists.repository';
import { RemoveTaskCommand } from './remove-task.command';

@CommandHandler(RemoveTaskCommand)
export class RemoveTaskHandler implements ICommandHandler<
  RemoveTaskCommand,
  void
> {
  constructor(
    @Inject(TASK_LISTS_REPOSITORY)
    private readonly taskListsRepository: TaskListsRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: RemoveTaskCommand): Promise<void> {
    const { restaurantId, taskListId, taskId, ownerId } = command.props;

    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    // A list of another restaurant answers 404, not 403, so that its existence is not revealed.
    const taskList = await this.taskListsRepository.findById(taskListId);
    if (!taskList || taskList.restaurantId !== restaurantId) {
      throw new NotFoundException('Liste introuvable');
    }
    if (!taskList.tasks.some((task) => task.id === taskId)) {
      throw new NotFoundException('Tâche introuvable');
    }

    await this.taskListsRepository.removeTask(taskId);
  }
}
