import { TimeRange } from '../value-objects/timeRange';

export type ShiftProps = {
  readonly id: string;
  readonly employeeId: string;
  readonly timeRange: TimeRange;
};

export class Shift {
  readonly id: string;
  readonly employeeId: string;
  readonly timeRange: TimeRange;

  constructor(props: ShiftProps) {
    this.id = props.id;
    this.employeeId = props.employeeId;
    this.timeRange = props.timeRange;
  }

  overlapsWith(other: Shift): boolean {
    return (
      this.employeeId === other.employeeId &&
      this.timeRange.overlaps(other.timeRange)
    );
  }

  get startTime(): Date {
    return this.timeRange.startTime;
  }

  get endTime(): Date {
    return this.timeRange.endTime;
  }
}
