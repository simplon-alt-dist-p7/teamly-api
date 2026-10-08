import { Injectable } from '@nestjs/common';
import { TaskList } from '../../domain/models/task-list.entity';
import { Task } from '../../domain/models/task.entity';
import { TaskListsRepository } from '../task-lists.repository';

@Injectable()
export class TaskListsInMemoryRepository implements TaskListsRepository {
  taskLists: TaskList[] = [];

  async save(taskList: TaskList): Promise<void> {
    this.taskLists.push(taskList);
  }

  async findById(id: string): Promise<TaskList | null> {
    return this.taskLists.find((list) => list.id === id) ?? null;
  }

  async findByRestaurantId(restaurantId: string): Promise<TaskList[]> {
    return this.taskLists.filter((list) => list.restaurantId === restaurantId);
  }

  async addTask(task: Task): Promise<void> {
    const taskList = this.taskLists.find((list) => list.id === task.taskListId);
    taskList?.tasks.push(task);
  }

  async removeTask(taskId: string): Promise<void> {
    for (const taskList of this.taskLists) {
      const index = taskList.tasks.findIndex((task) => task.id === taskId);
      if (index !== -1) {
        taskList.tasks.splice(index, 1);
      }
    }
  }
}
