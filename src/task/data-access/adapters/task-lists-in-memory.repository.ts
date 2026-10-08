import { Injectable } from '@nestjs/common';
import { TaskList } from '../../domain/models/task-list.entity';
import { TaskListsRepository } from '../task-lists.repository';

@Injectable()
export class TaskListsInMemoryRepository implements TaskListsRepository {
  taskLists: TaskList[] = [];

  save(taskList: TaskList): Promise<void> {
    this.taskLists.push(taskList);
    return Promise.resolve();
  }
}
