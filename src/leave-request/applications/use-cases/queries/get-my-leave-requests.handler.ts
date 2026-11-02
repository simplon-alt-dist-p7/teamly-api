import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  LEAVE_REQUEST_REPOSITORY,
  type LeaveRequestRepository,
} from 'src/leave-request/data-access/leave-requests.repository';
import { LeaveRequest } from 'src/leave-request/domain/models/leave-request.entity';
import { GetMyLeaveRequestsQuery } from './get-my-leave-requests.query';

@QueryHandler(GetMyLeaveRequestsQuery)
export class GetMyLeaveRequestsHandler implements IQueryHandler<
  GetMyLeaveRequestsQuery,
  LeaveRequest[]
> {
  constructor(
    @Inject(LEAVE_REQUEST_REPOSITORY)
    private readonly leaveRequestsRepository: LeaveRequestRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
  ) {}

  async execute(query: GetMyLeaveRequestsQuery): Promise<LeaveRequest[]> {
    const employee = await this.employeesRepository.findByUserId(query.userId);
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return this.leaveRequestsRepository.findByEmployeeId(employee.id);
  }
}
