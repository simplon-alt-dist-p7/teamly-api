import { Injectable } from '@nestjs/common';
import { LeaveRequest } from '../../domain/models/leave-request.entity';
import { LeaveRequestRepository } from '../leave-requests.repository';

@Injectable()
export class LeaveRequestsInMemoryRepository implements LeaveRequestRepository {
  leaveRequests: LeaveRequest[] = [];

  async save(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    this.leaveRequests.push(leaveRequest);
    return leaveRequest;
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    return this.leaveRequests.filter(
      (leaveRequest) => leaveRequest.employeeId === employeeId,
    );
  }
}
