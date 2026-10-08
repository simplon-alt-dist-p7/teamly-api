import { EmptyTaskLabelError } from '../errors/task.errors';

export type TaskProps = {
  readonly id: string;
  readonly taskListId: string;
  readonly label: string;
};

export class Task {
  readonly id: string;
  readonly taskListId: string;
  readonly label: string;

  constructor(props: TaskProps) {
    const label = props.label.trim();
    if (label === '') {
      throw new EmptyTaskLabelError();
    }

    this.id = props.id;
    this.taskListId = props.taskListId;
    this.label = label;
  }
}
