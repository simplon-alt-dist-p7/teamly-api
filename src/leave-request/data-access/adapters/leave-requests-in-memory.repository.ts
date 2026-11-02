import { Injectable } from '@nestjs/common';
import { LeaveRequest } from '../../domain/models/leave-request.entity';
import {
  LeaveRequestRepository,
  TeamLeaveRequest,
} from '../leave-requests.repository';

function byMostRecentStart(a: LeaveRequest, b: LeaveRequest): number {
  return b.startDate.getTime() - a.startDate.getTime();
}

type InMemoryEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  restaurantId: string;
};

@Injectable()
export class LeaveRequestsInMemoryRepository implements LeaveRequestRepository {
  leaveRequests: LeaveRequest[] = [];
  // Les tests ajoutent ici les employés, pour retrouver leur nom et leur restaurant.
  employees: InMemoryEmployee[] = [];

  async save(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    this.leaveRequests.push(leaveRequest);
    return leaveRequest;
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    return this.leaveRequests
      .filter((leaveRequest) => leaveRequest.employeeId === employeeId)
      .sort(byMostRecentStart);
  }

  async findByRestaurantId(restaurantId: string): Promise<TeamLeaveRequest[]> {
    const result: TeamLeaveRequest[] = [];
    for (const leaveRequest of this.leaveRequests) {
      const employee = this.employees.find(
        (employee) => employee.id === leaveRequest.employeeId,
      );
      if (employee && employee.restaurantId === restaurantId) {
        result.push({
          leaveRequest,
          firstName: employee.firstName,
          lastName: employee.lastName,
        });
      }
    }
    return result.sort((a, b) =>
      byMostRecentStart(a.leaveRequest, b.leaveRequest),
    );
  }
}
