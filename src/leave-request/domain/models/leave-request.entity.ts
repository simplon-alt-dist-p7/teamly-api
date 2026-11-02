import { InvalidLeaveDatesError } from '../errors/leave-request.errors';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type LeaveRequestProps = {
  readonly id: string;
  readonly employeeId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: LeaveStatus;
  readonly createdAt: Date;
};

// Un congé couvre des jours entiers : startDate et endDate sont tous les deux inclus.
export class LeaveRequest {
  readonly id: string;
  readonly employeeId: string;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly status: LeaveStatus;
  readonly createdAt: Date;

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
  }

  // Une demande refusée ne bloque plus ses dates.
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
}
