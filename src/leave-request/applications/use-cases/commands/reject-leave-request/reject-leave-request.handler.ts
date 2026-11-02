import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  LEAVE_REQUEST_REPOSITORY,
  type LeaveRequestRepository,
} from 'src/leave-request/data-access/leave-requests.repository';
import { LeaveRequestAlreadyDecidedError } from 'src/leave-request/domain/errors/leave-request.errors';
import { LeaveRequest } from 'src/leave-request/domain/models/leave-request.entity';
import type { RestaurantsRepository } from 'src/restaurant/data-access/restaurants.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { findLeaveRequestForOwner } from '../find-leave-request-for-owner';
import { RejectLeaveRequestCommand } from './reject-leave-request.command';

@CommandHandler(RejectLeaveRequestCommand)
export class RejectLeaveRequestHandler implements ICommandHandler<
  RejectLeaveRequestCommand,
  LeaveRequest
> {
  constructor(
    @Inject(LEAVE_REQUEST_REPOSITORY)
    private readonly leaveRequestsRepository: LeaveRequestRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(RESTAURANTS_REPOSITORY)
    private readonly restaurantsRepository: RestaurantsRepository,
  ) {}

  async execute(command: RejectLeaveRequestCommand) {
    const leaveRequest = await findLeaveRequestForOwner(
      command.leaveRequestId,
      command.ownerId,
      this.leaveRequestsRepository,
      this.employeesRepository,
      this.restaurantsRepository,
    );

    let decided: LeaveRequest;
    try {
      decided = leaveRequest.reject(command.managerNote);
    } catch (error) {
      if (error instanceof LeaveRequestAlreadyDecidedError) {
        throw new ConflictException('Cette demande a déjà reçu une réponse');
      }
      throw error;
    }

    return this.leaveRequestsRepository.update(decided);
  }
}
