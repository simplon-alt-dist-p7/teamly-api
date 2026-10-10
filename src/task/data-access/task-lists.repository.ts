import { TaskCheck } from '../domain/models/task-check.entity';
import { TaskList } from '../domain/models/task-list.entity';
import { Task } from '../domain/models/task.entity';

export interface TaskListsRepository {
  save(taskList: TaskList): Promise<void>;
  findById(id: string): Promise<TaskList | null>;
  findByRestaurantId(restaurantId: string, day?: Date): Promise<TaskList[]>;
  addTask(task: Task): Promise<void>;
  removeTask(taskId: string): Promise<void>;

  findTaskCheck(taskId: string, day: Date): Promise<TaskCheck | null>;
  addTaskCheck(taskCheck: TaskCheck): Promise<void>;
}

export const TASK_LISTS_REPOSITORY = Symbol('TASK_LISTS_REPOSITORY');
