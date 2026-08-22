import { InvalidTimeRangeError } from '../errors/time-range.errors';

export type TimeRangeProps = {
  readonly startTime: Date;
  readonly endTime: Date;
};

export class TimeRange {
  readonly startTime: Date;
  readonly endTime: Date;

  constructor(props: TimeRangeProps) {
    if (props.startTime >= props.endTime) {
      throw new InvalidTimeRangeError();
    }

    this.startTime = props.startTime;
    this.endTime = props.endTime;
  }

  equals(other: TimeRange): boolean {
    return (
      this.startTime.getTime() === other.startTime.getTime() &&
      this.endTime.getTime() === other.endTime.getTime()
    );
  }

  overlaps(other: TimeRange): boolean {
    return this.startTime < other.endTime && other.startTime < this.endTime;
  }
}
