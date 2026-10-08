import { TaskList } from '../domain/models/task-list.entity';

export interface TaskListsRepository {
  save(taskList: TaskList): Promise<void>;
  findByRestaurantId(restaurantId: string): Promise<TaskList[]>;
}

export const TASK_LISTS_REPOSITORY = Symbol('TASK_LISTS_REPOSITORY');
