import {
  InvalidLeaveDatesError,
  LeaveRequestAlreadyDecidedError,
} from '../errors/leave-request.errors';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LeaveRequestProps = {
  readonly id: string;
  readonly employeeId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: LeaveStatus;
  readonly createdAt: Date;
  readonly managerNote?: string | null;
};

// Un congé couvre des jours entiers : startDate et endDate sont tous les deux inclus.
export class LeaveRequest {
  readonly id: string;
  readonly employeeId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: LeaveStatus;
  readonly createdAt: Date;
  readonly managerNote: string | null;

  constructor(props: LeaveRequestProps) {
    if (props.endDate < props.startDate) {
      throw new InvalidLeaveDatesError();
    }

    this.id = props.id;
    this.employeeId = props.employeeId;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.managerNote = props.managerNote ?? null;
  }

  overlapsWith(other: LeaveRequest): boolean {
    if (other.status === 'REJECTED') {
      return false;
    }
    return (
      this.employeeId === other.employeeId &&
      this.startDate <= other.endDate &&
      other.startDate <= this.endDate
    );
  }

  approve(): LeaveRequest {
    this.ensurePending();
    return new LeaveRequest({ ...this, status: 'APPROVED' });
  }

  reject(managerNote: string | null): LeaveRequest {
    this.ensurePending();
    return new LeaveRequest({ ...this, status: 'REJECTED', managerNote });
  }

  private ensurePending() {
    if (this.status !== 'PENDING') {
      throw new LeaveRequestAlreadyDecidedError();
    }
  }
}
