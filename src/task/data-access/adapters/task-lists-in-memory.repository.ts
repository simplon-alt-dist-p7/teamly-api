import { Injectable } from '@nestjs/common';
import { TaskList } from '../../domain/models/task-list.entity';
import { TaskListsRepository } from '../task-lists.repository';

@Injectable()
export class TaskListsInMemoryRepository implements TaskListsRepository {
  taskLists: TaskList[] = [];

  async save(taskList: TaskList): Promise<void> {
    this.taskLists.push(taskList);
    return Promise.resolve();
  }

  async findByRestaurantId(restaurantId: string): Promise<TaskList[]> {
    return this.taskLists.filter((list) => list.restaurantId === restaurantId);
  }
}
