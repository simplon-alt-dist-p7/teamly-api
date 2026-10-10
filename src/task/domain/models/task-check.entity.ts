export type TaskCheckProps = {
  readonly id: string;
  readonly taskId: string;
  readonly employeeId: string;
  readonly day: Date;
  readonly checkedAt: Date;
};

export class TaskCheck {
  readonly id: string;
  readonly taskId: string;
  readonly employeeId: string;
  readonly day: Date;
  readonly checkedAt: Date;

  constructor(props: TaskCheckProps) {
    this.id = props.id;
    this.taskId = props.taskId;
    this.employeeId = props.employeeId;
    this.day = props.day;
    this.checkedAt = props.checkedAt;
  }
}
