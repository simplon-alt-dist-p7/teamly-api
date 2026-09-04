import { Shift } from '../models/shift.entity';
import { TimeRange } from '../value-objects/timeRange';

describe('Shift', () => {
  const employeeId = 'employee-1';
  const otherEmployeeId = 'employee-2';

  const morning = new TimeRange({
    startTime: new Date('2026-08-16T09:00:00.000Z'),
    endTime: new Date('2026-08-16T12:00:00.000Z'),
  });

  const afternoon = new TimeRange({
    startTime: new Date('2026-08-16T12:00:00.000Z'),
    endTime: new Date('2026-08-16T17:00:00.000Z'),
  });

  const overlapping = new TimeRange({
    startTime: new Date('2026-08-16T11:00:00.000Z'),
    endTime: new Date('2026-08-16T14:00:00.000Z'),
  });

  describe('overlapsWith', () => {
    it('should return true, given same employee and overlapping ranges', () => {
      const shiftA = new Shift({
        id: 'shift-1',
        employeeId,
        timeRange: morning,
      });
      const shiftB = new Shift({
        id: 'shift-2',
        employeeId,
        timeRange: overlapping,
      });

      expect(shiftA.overlapsWith(shiftB)).toBe(true);
    });

    it('should return false, given same employee and adjacent ranges', () => {
      const shiftA = new Shift({
        id: 'shift-1',
        employeeId,
        timeRange: morning,
      });
      const shiftB = new Shift({
        id: 'shift-2',
        employeeId,
        timeRange: afternoon,
      });

      expect(shiftA.overlapsWith(shiftB)).toBe(false);
    });

    it('should return false, given different employees and overlapping ranges', () => {
      const shiftA = new Shift({
        id: 'shift-1',
        employeeId,
        timeRange: morning,
      });
      const shiftB = new Shift({
        id: 'shift-2',
        employeeId: otherEmployeeId,
        timeRange: overlapping,
      });

      expect(shiftA.overlapsWith(shiftB)).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return startTime and endTime from timeRange', () => {
      const shift = new Shift({
        id: 'shift-1',
        employeeId,
        timeRange: morning,
      });

      expect(shift.startTime).toEqual(morning.startTime);
      expect(shift.endTime).toEqual(morning.endTime);
    });
  });

  describe('cloneWithNewTimeRange', () => {
    it('keeps the same id and employeeId', () => {
      const shift = new Shift({
        id: 'shift-1',
        employeeId,
        timeRange: morning,
      });

      const cloned = shift.cloneWithNewTimeRange(afternoon);

      expect(cloned.id).toBe(shift.id);
      expect(cloned.employeeId).toBe(shift.employeeId);
    });

    it('uses the new time range', () => {
      const shift = new Shift({
        id: 'shift-1',
        employeeId,
        timeRange: morning,
      });

      const cloned = shift.cloneWithNewTimeRange(afternoon);

      expect(cloned.startTime).toEqual(afternoon.startTime);
      expect(cloned.endTime).toEqual(afternoon.endTime);
    });

    it('does not mutate the original shift', () => {
      const shift = new Shift({
        id: 'shift-1',
        employeeId,
        timeRange: morning,
      });

      shift.cloneWithNewTimeRange(afternoon);

      expect(shift.startTime).toEqual(morning.startTime);
      expect(shift.endTime).toEqual(morning.endTime);
    });
  });
});
