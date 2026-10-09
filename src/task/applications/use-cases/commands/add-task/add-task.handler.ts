import {
  BadRequestException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import {
  TASK_LISTS_REPOSITORY,
  type TaskListsRepository,
} from 'src/task/data-access/task-lists.repository';
import { EmptyTaskLabelError } from 'src/task/domain/errors/task.errors';
import { Task } from 'src/task/domain/models/task.entity';
import { AddTaskCommand } from './add-task.command';

@CommandHandler(AddTaskCommand)
export class AddTaskHandler implements ICommandHandler<AddTaskCommand, Task> {
  constructor(
    @Inject(TASK_LISTS_REPOSITORY)
    private readonly taskListsRepository: TaskListsRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: AddTaskCommand): Promise<Task> {
    const { restaurantId, taskListId, label, ownerId, requiresValidation } =
      command.props;

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

    let task: Task;

    try {
      task = new Task({
        id: randomUUID(),
        taskListId,
        label,
        requiresValidation,
      });
    } catch (error) {
      if (error instanceof EmptyTaskLabelError) {
        throw new BadRequestException('Le libellé de la tâche est obligatoire');
      }
      throw error;
    }

    await this.taskListsRepository.addTask(task);
    return task;
  }
}
