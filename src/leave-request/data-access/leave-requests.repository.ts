import { LeaveRequest } from '../domain/models/leave-request.entity';

export interface LeaveRequestRepository {
  save(leaveRequest: LeaveRequest): Promise<LeaveRequest>;
  findByEmployeeId(employeeId: string): Promise<LeaveRequest[]>;
}

export const LEAVE_REQUEST_REPOSITORY = Symbol('LEAVE_REQUEST_REPOSITORY');
