import {
  BadRequestException,
  ConflictException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import { format } from 'date-fns';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  LEAVE_REQUEST_REPOSITORY,
  type LeaveRequestRepository,
} from 'src/leave-request/data-access/leave-requests.repository';
import { InvalidLeaveDatesError } from 'src/leave-request/domain/errors/leave-request.errors';
import { LeaveRequest } from 'src/leave-request/domain/models/leave-request.entity';
import { CreateLeaveRequestCommand } from './create-leave-request.command';

@CommandHandler(CreateLeaveRequestCommand)
export class CreateLeaveRequestHandler implements ICommandHandler<
  CreateLeaveRequestCommand,
  LeaveRequest
> {
  constructor(
    @Inject(LEAVE_REQUEST_REPOSITORY)
    private readonly leaveRequestsRepository: LeaveRequestRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
  ) {}

  async execute(command: CreateLeaveRequestCommand) {
    const employee = await this.employeesRepository.findByUserId(
      command.userId,
    );
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const today = new Date(format(new Date(), 'yyyy-MM-dd'));
    if (command.startDate < today) {
      throw new BadRequestException('Le premier jour est déjà passé');
    }

    let leaveRequest: LeaveRequest;
    try {
      leaveRequest = new LeaveRequest({
        id: randomUUID(),
        employeeId: employee.id,
        startDate: command.startDate,
        endDate: command.endDate,
        status: 'PENDING',
        createdAt: new Date(),
      });
    } catch (error) {
      if (error instanceof InvalidLeaveDatesError) {
        throw new BadRequestException(
          'Le dernier jour doit être après le premier jour',
        );
      }
      throw error;
    }

    const existing = await this.leaveRequestsRepository.findByEmployeeId(
      employee.id,
    );
    if (existing.some((other) => leaveRequest.overlapsWith(other))) {
      throw new ConflictException('Tu as déjà une demande sur ces dates');
    }

    return this.leaveRequestsRepository.save(leaveRequest);
  }
}
