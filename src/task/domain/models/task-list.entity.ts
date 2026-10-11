import { EmptyTaskListNameError } from '../errors/task.errors';
import { Task } from './task.entity';

export type TaskListProps = {
  readonly id: string;
  readonly restaurantId: string;
  readonly name: string;
  readonly tasks: Task[];
};

export class TaskList {
  readonly id: string;
  readonly restaurantId: string;
  readonly name: string;
  readonly tasks: Task[];

  constructor(props: TaskListProps) {
    const trimmedName = props.name.trim();
    if (trimmedName === '') {
      throw new EmptyTaskListNameError();
    }

    const name = trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1);

    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.name = name;
    this.tasks = props.tasks;
  }
}
