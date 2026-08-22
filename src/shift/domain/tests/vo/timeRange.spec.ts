import { InvalidTimeRangeError } from '../../errors/time-range.errors';
import { TimeRange } from '../../value-objects/timeRange';

describe('TimeRange', () => {
  const start = new Date('2026-08-16T10:00:00.000Z');
  const end = new Date('2026-08-16T12:00:00.000Z');

  it('should throw error when startTime is >= endTime', () => {
    expect(() => new TimeRange({ startTime: end, endTime: start })).toThrow(
      InvalidTimeRangeError,
    );
    expect(() => new TimeRange({ startTime: start, endTime: start })).toThrow(
      InvalidTimeRangeError,
    );
  });

  it('should create when startTime is before endTime', () => {
    const range = new TimeRange({ startTime: start, endTime: end });

    expect(range.startTime).toEqual(start);
    expect(range.endTime).toEqual(end);
  });
});
