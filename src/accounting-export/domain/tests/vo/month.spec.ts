import { Month } from '../../value-objects/month';

const NOVEMBER_1ST_MIDNIGHT_PARIS = new Date('2026-11-01T00:00:00+01:00');
const DECEMBER_1ST_MIDNIGHT_PARIS = new Date('2026-12-01T00:00:00+01:00');
describe('Month', () => {
  describe('constructor', () => {
    it('should start on the 1st at midnight Paris time, given 2026-11', () => {
      const month = new Month({ yearMonth: '2026-11' });

      expect(month.start).toEqual(NOVEMBER_1ST_MIDNIGHT_PARIS);
    });

    it('should end on the 1st of the next month at midnight Paris time, given 2026-11', () => {
      const month = new Month({ yearMonth: '2026-11' });

      expect(month.end).toEqual(DECEMBER_1ST_MIDNIGHT_PARIS);
    });
  });
});
