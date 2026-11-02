import { LeaveRequestAlreadyDecidedError } from '../errors/leave-request.errors';
import { LeaveRequest, LeaveStatus } from '../models/leave-request.entity';

function leave(status: LeaveStatus): LeaveRequest {
  return new LeaveRequest({
    id: 'leave-1',
    employeeId: 'karim',
    startDate: new Date('2026-11-12'),
    endDate: new Date('2026-11-15'),
    status,
    createdAt: new Date('2026-11-01'),
  });
}

describe('LeaveRequest', () => {
  it('approves a pending request', () => {
    const approved = leave('PENDING').approve();

    expect(approved.status).toBe('APPROVED');
    expect(approved.startDate).toEqual(new Date('2026-11-12'));
  });

  it('rejects a pending request with the manager note', () => {
    const rejected = leave('PENDING').reject('Trop de monde en congé');

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.managerNote).toBe('Trop de monde en congé');
  });

  it('rejects a pending request without a note', () => {
    expect(leave('PENDING').reject(null).managerNote).toBeNull();
  });

  it('cannot decide a request twice', () => {
    expect(() => leave('APPROVED').approve()).toThrow(
      LeaveRequestAlreadyDecidedError,
    );
    expect(() => leave('APPROVED').reject(null)).toThrow(
      LeaveRequestAlreadyDecidedError,
    );
    expect(() => leave('REJECTED').approve()).toThrow(
      LeaveRequestAlreadyDecidedError,
    );
  });
});
