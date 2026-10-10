import { EmptyTaskLabelError } from '../errors/task.errors';

export type TodayCheck = {
  readonly employeeFirstName: string;
  readonly employeeLastName: string;
  readonly checkedAt: Date;
};

export type TaskProps = {
  readonly id: string;
  readonly taskListId: string;
  readonly label: string;
  readonly requiresValidation: boolean;
  readonly todayCheck?: TodayCheck | null;
};

export class Task {
  readonly id: string;
  readonly taskListId: string;
  readonly label: string;
  readonly requiresValidation: boolean;
  readonly todayCheck?: TodayCheck | null;

  constructor(props: TaskProps) {
    const label = props.label.trim();
    if (label === '') {
      throw new EmptyTaskLabelError();
    }

    this.id = props.id;
    this.taskListId = props.taskListId;
    this.label = label;
    this.requiresValidation = props.requiresValidation;
    this.todayCheck = props.todayCheck;
  }
}
