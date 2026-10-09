import { EmptyTaskLabelError } from '../errors/task.errors';

export type TaskProps = {
  readonly id: string;
  readonly taskListId: string;
  readonly label: string;
  readonly requiresValidation: boolean;
};

export class Task {
  readonly id: string;
  readonly taskListId: string;
  readonly label: string;
  readonly requiresValidation: boolean;

  constructor(props: TaskProps) {
    const label = props.label.trim();
    if (label === '') {
      throw new EmptyTaskLabelError();
    }

    this.id = props.id;
    this.taskListId = props.taskListId;
    this.label = label;
    this.requiresValidation = props.requiresValidation;
  }
}
