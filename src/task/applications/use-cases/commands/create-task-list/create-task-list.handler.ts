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
import { EmptyTaskListNameError } from 'src/task/domain/errors/task.errors';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { CreateTaskListCommand } from './create-task-list.command';

@CommandHandler(CreateTaskListCommand)
export class CreateTaskListHandler implements ICommandHandler<
  CreateTaskListCommand,
  TaskList
> {
  constructor(
    @Inject(TASK_LISTS_REPOSITORY)
    private readonly taskListsRepository: TaskListsRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: CreateTaskListCommand): Promise<TaskList> {
    const { restaurantId, name, ownerId } = command.props;

    const restaurant = await this.restaurantsRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant introuvable');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        "Vous n'êtes pas le propriétaire de ce restaurant",
      );
    }

    let taskList: TaskList;

    try {
      taskList = new TaskList({
        id: randomUUID(),
        restaurantId,
        name,
        tasks: [],
      });
    } catch (error) {
      if (error instanceof EmptyTaskListNameError) {
        throw new BadRequestException('Le nom de la liste est obligatoire');
      }
      throw error;
    }

    await this.taskListsRepository.save(taskList);
    return taskList;
  }
}
