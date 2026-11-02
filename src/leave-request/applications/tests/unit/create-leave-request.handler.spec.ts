import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { addDays, format } from 'date-fns';

import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { LeaveRequestsInMemoryRepository } from 'src/leave-request/data-access/adapters/leave-requests-in-memory.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import { LeaveRequest } from 'src/leave-request/domain/models/leave-request.entity';
import { CreateLeaveRequestCommand } from '../../use-cases/commands/create-leave-request/create-leave-request.command';
import { CreateLeaveRequestHandler } from '../../use-cases/commands/create-leave-request/create-leave-request.handler';

function day(offset: number): Date {
  return new Date(format(addDays(new Date(), offset), 'yyyy-MM-dd'));
}

describe('CreateLeaveRequestHandler', () => {
  let handler: CreateLeaveRequestHandler;
  let leaveRequestsRepository: LeaveRequestsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;
  let employeeId: string;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateLeaveRequestHandler,
        {
          provide: LEAVE_REQUEST_REPOSITORY,
          useClass: LeaveRequestsInMemoryRepository,
        },
        {
          provide: EMPLOYEES_REPOSITORY,
          useClass: EmployeesInMemoryRepository,
        },
      ],
    }).compile();

    handler = module.get(CreateLeaveRequestHandler);
    leaveRequestsRepository = module.get(LEAVE_REQUEST_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);

    const employee = await employeesRepository.create({
      userId: 'user-1',
      restaurantId: 'restaurant-1',
      firstName: 'Karim',
      lastName: 'Benali',
    });
    employeeId = employee.id;
  });

  it('creates a pending leave request for the logged-in employee', async () => {
    const result = await handler.execute(
      new CreateLeaveRequestCommand('user-1', day(11), day(14)),
    );

    expect(result.employeeId).toBe(employeeId);
    expect(result.status).toBe('PENDING');
    expect(leaveRequestsRepository.leaveRequests).toHaveLength(1);
  });

  it('accepts a one-day leave (same first and last day)', async () => {
    const result = await handler.execute(
      new CreateLeaveRequestCommand('user-1', day(3), day(3)),
    );

    expect(result.startDate).toEqual(result.endDate);
  });

  it('accepts a leave starting today', async () => {
    await expect(
      handler.execute(new CreateLeaveRequestCommand('user-1', day(0), day(1))),
    ).resolves.toBeInstanceOf(LeaveRequest);
  });

  it('throws NotFoundException if the user is not an employee', async () => {
    await expect(
      handler.execute(
        new CreateLeaveRequestCommand('unknown-user', day(11), day(14)),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(leaveRequestsRepository.leaveRequests).toHaveLength(0);
  });

  it('throws BadRequestException if the last day is before the first day', async () => {
    await expect(
      handler.execute(
        new CreateLeaveRequestCommand('user-1', day(14), day(11)),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(leaveRequestsRepository.leaveRequests).toHaveLength(0);
  });

  it('throws BadRequestException if the first day is in the past', async () => {
    await expect(
      handler.execute(new CreateLeaveRequestCommand('user-1', day(-2), day(3))),
    ).rejects.toThrow(BadRequestException);
    expect(leaveRequestsRepository.leaveRequests).toHaveLength(0);
  });

  it('throws ConflictException if the dates overlap a pending request', async () => {
    await handler.execute(
      new CreateLeaveRequestCommand('user-1', day(11), day(14)),
    );

    await expect(
      handler.execute(
        new CreateLeaveRequestCommand('user-1', day(14), day(16)),
      ),
    ).rejects.toThrow(ConflictException);
    expect(leaveRequestsRepository.leaveRequests).toHaveLength(1);
  });

  it('allows new dates over a rejected request', async () => {
    await leaveRequestsRepository.save(
      new LeaveRequest({
        id: 'rejected-1',
        employeeId,
        startDate: day(11),
        endDate: day(14),
        status: 'REJECTED',
        createdAt: new Date(),
      }),
    );

    await handler.execute(
      new CreateLeaveRequestCommand('user-1', day(11), day(14)),
    );

    expect(leaveRequestsRepository.leaveRequests).toHaveLength(2);
  });
});
