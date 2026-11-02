import { LeaveRequest } from '../domain/models/leave-request.entity';

// Une demande vue par le gérant : avec le nom de l'employé.
export type TeamLeaveRequest = {
  readonly leaveRequest: LeaveRequest;
  readonly firstName: string;
  readonly lastName: string;
};

export interface LeaveRequestRepository {
  save(leaveRequest: LeaveRequest): Promise<LeaveRequest>;
  update(leaveRequest: LeaveRequest): Promise<LeaveRequest>;
  findById(id: string): Promise<LeaveRequest | null>;
  findByEmployeeId(employeeId: string): Promise<LeaveRequest[]>;
  findByRestaurantId(restaurantId: string): Promise<TeamLeaveRequest[]>;
}

export const LEAVE_REQUEST_REPOSITORY = Symbol('LEAVE_REQUEST_REPOSITORY');
