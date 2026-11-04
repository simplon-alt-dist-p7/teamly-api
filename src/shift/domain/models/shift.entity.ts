import { TimeRange } from '../value-objects/timeRange';

export type ShiftProps = {
  readonly id: string;
  readonly employeeId: string;
  readonly timeRange: TimeRange;
  readonly note?: string | null;
};

export class Shift {
  readonly id: string;
  readonly employeeId: string;
  readonly timeRange: TimeRange;
  readonly note: string | null;

  constructor(props: ShiftProps) {
    this.id = props.id;
    this.employeeId = props.employeeId;
    this.timeRange = props.timeRange;
    this.note = props.note ?? null;
  }

  overlapsWith(other: Shift): boolean {
    return (
      this.employeeId === other.employeeId &&
      this.timeRange.overlaps(other.timeRange)
    );
  }

  cloneWithNewTimeRange(timeRange: TimeRange, note = this.note): Shift {
    return new Shift({
      id: this.id,
      employeeId: this.employeeId,
      timeRange: timeRange,
      note,
    });
  }

  get startTime(): Date {
    return this.timeRange.startTime;
  }

  get endTime(): Date {
    return this.timeRange.endTime;
  }
}
