import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { addDays, format } from 'date-fns';

import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { LeaveRequestsInMemoryRepository } from 'src/leave-request/data-access/adapters/leave-requests-in-memory.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import {
  LeaveRequest,
  LeaveStatus,
} from 'src/leave-request/domain/models/leave-request.entity';
import { GetMyLeaveRequestsHandler } from '../../use-cases/queries/get-my-leave-requests.handler';
import { GetMyLeaveRequestsQuery } from '../../use-cases/queries/get-my-leave-requests.query';

function day(offset: number): Date {
  return new Date(format(addDays(new Date(), offset), 'yyyy-MM-dd'));
}

function leave(
  id: string,
  employeeId: string,
  startOffset: number,
  status: LeaveStatus,
): LeaveRequest {
  return new LeaveRequest({
    id,
    employeeId,
    startDate: day(startOffset),
    endDate: day(startOffset + 1),
    status,
    createdAt: new Date(),
  });
}

describe('GetMyLeaveRequestsHandler', () => {
  let handler: GetMyLeaveRequestsHandler;
  let leaveRequestsRepository: LeaveRequestsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyLeaveRequestsHandler,
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

    handler = module.get(GetMyLeaveRequestsHandler);
    leaveRequestsRepository = module.get(LEAVE_REQUEST_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
  });

  async function createEmployee(userId: string) {
    return employeesRepository.create({
      userId,
      restaurantId: 'restaurant-1',
      firstName: 'Karim',
      lastName: 'Benali',
    });
  }

  it('throws NotFoundException if the user is not an employee', async () => {
    await expect(
      handler.execute(new GetMyLeaveRequestsQuery('unknown-user')),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns an empty list when the employee has no request', async () => {
    await createEmployee('user-1');

    const result = await handler.execute(new GetMyLeaveRequestsQuery('user-1'));

    expect(result).toEqual([]);
  });

  it('returns only the requests of the logged-in employee', async () => {
    const karim = await createEmployee('user-1');
    const ines = await createEmployee('user-2');
    await leaveRequestsRepository.save(
      leave('karim-1', karim.id, 10, 'PENDING'),
    );
    await leaveRequestsRepository.save(leave('ines-1', ines.id, 10, 'PENDING'));

    const result = await handler.execute(new GetMyLeaveRequestsQuery('user-1'));

    expect(result.map((r) => r.id)).toEqual(['karim-1']);
  });

  it('returns the most recent requests first', async () => {
    const karim = await createEmployee('user-1');
    await leaveRequestsRepository.save(leave('old', karim.id, -30, 'REJECTED'));
    await leaveRequestsRepository.save(
      leave('later', karim.id, 50, 'APPROVED'),
    );
    await leaveRequestsRepository.save(
      leave('pending', karim.id, 10, 'PENDING'),
    );

    const result = await handler.execute(new GetMyLeaveRequestsQuery('user-1'));

    expect(result.map((r) => r.id)).toEqual(['later', 'pending', 'old']);
  });
});
