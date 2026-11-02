import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { LeaveRequestsInMemoryRepository } from 'src/leave-request/data-access/adapters/leave-requests-in-memory.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import {
  LeaveRequest,
  LeaveStatus,
} from 'src/leave-request/domain/models/leave-request.entity';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { ApproveLeaveRequestCommand } from '../../use-cases/commands/approve-leave-request/approve-leave-request.command';
import { ApproveLeaveRequestHandler } from '../../use-cases/commands/approve-leave-request/approve-leave-request.handler';
import { RejectLeaveRequestCommand } from '../../use-cases/commands/reject-leave-request/reject-leave-request.command';
import { RejectLeaveRequestHandler } from '../../use-cases/commands/reject-leave-request/reject-leave-request.handler';

describe('Approve and reject a leave request', () => {
  let approveHandler: ApproveLeaveRequestHandler;
  let rejectHandler: RejectLeaveRequestHandler;
  let leaveRequestsRepository: LeaveRequestsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;
  let employeeId: string;

  const ownerId = 'owner-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApproveLeaveRequestHandler,
        RejectLeaveRequestHandler,
        {
          provide: LEAVE_REQUEST_REPOSITORY,
          useClass: LeaveRequestsInMemoryRepository,
        },
        {
          provide: EMPLOYEES_REPOSITORY,
          useClass: EmployeesInMemoryRepository,
        },
        {
          provide: RESTAURANTS_REPOSITORY,
          useClass: RestaurantsInMemoryRepository,
        },
      ],
    }).compile();

    approveHandler = module.get(ApproveLeaveRequestHandler);
    rejectHandler = module.get(RejectLeaveRequestHandler);
    leaveRequestsRepository = module.get(LEAVE_REQUEST_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);

    const restaurant = await restaurantsRepository.create(
      {
        name: 'Fratellino',
        address: '10 rue de Paris',
        phone: '+33612345678',
        email: 'contact@test.com',
      },
      ownerId,
    );
    const employee = await employeesRepository.create({
      userId: 'user-1',
      restaurantId: restaurant.id,
      firstName: 'Karim',
      lastName: 'Benali',
    });
    employeeId = employee.id;
  });

  async function saveLeave(status: LeaveStatus = 'PENDING') {
    return leaveRequestsRepository.save(
      new LeaveRequest({
        id: 'leave-1',
        employeeId,
        startDate: new Date('2026-11-12'),
        endDate: new Date('2026-11-15'),
        status,
        createdAt: new Date(),
      }),
    );
  }

  it('approves a pending request', async () => {
    await saveLeave();

    const result = await approveHandler.execute(
      new ApproveLeaveRequestCommand('leave-1', ownerId),
    );

    expect(result.status).toBe('APPROVED');
    expect((await leaveRequestsRepository.findById('leave-1'))?.status).toBe(
      'APPROVED',
    );
  });

  it('rejects a pending request with the manager note', async () => {
    await saveLeave();

    await rejectHandler.execute(
      new RejectLeaveRequestCommand('leave-1', ownerId, 'Fin d’année chargée'),
    );

    const saved = await leaveRequestsRepository.findById('leave-1');
    expect(saved?.status).toBe('REJECTED');
    expect(saved?.managerNote).toBe('Fin d’année chargée');
  });

  it('throws NotFoundException if the request does not exist', async () => {
    await expect(
      approveHandler.execute(
        new ApproveLeaveRequestCommand('unknown', ownerId),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if the requester is not the owner', async () => {
    await saveLeave();

    await expect(
      approveHandler.execute(
        new ApproveLeaveRequestCommand('leave-1', 'someone-else'),
      ),
    ).rejects.toThrow(ForbiddenException);
    expect((await leaveRequestsRepository.findById('leave-1'))?.status).toBe(
      'PENDING',
    );
  });

  it('throws ConflictException if the request was already decided', async () => {
    await saveLeave('APPROVED');

    await expect(
      rejectHandler.execute(
        new RejectLeaveRequestCommand('leave-1', ownerId, null),
      ),
    ).rejects.toThrow(ConflictException);
    expect((await leaveRequestsRepository.findById('leave-1'))?.status).toBe(
      'APPROVED',
    );
  });
});
