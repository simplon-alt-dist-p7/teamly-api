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
    const name = props.name.trim();
    if (name === '') {
      throw new EmptyTaskListNameError();
    }

    this.id = props.id;
    this.restaurantId = props.restaurantId;
    this.name = name;
    this.tasks = props.tasks;
  }
}
