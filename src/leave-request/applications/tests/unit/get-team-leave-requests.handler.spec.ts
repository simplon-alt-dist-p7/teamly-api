import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { addDays, format } from 'date-fns';

import { LeaveRequestsInMemoryRepository } from 'src/leave-request/data-access/adapters/leave-requests-in-memory.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import {
  LeaveRequest,
  LeaveStatus,
} from 'src/leave-request/domain/models/leave-request.entity';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { GetTeamLeaveRequestsHandler } from '../../use-cases/queries/get-team-leave-requests.handler';
import { GetTeamLeaveRequestsQuery } from '../../use-cases/queries/get-team-leave-requests.query';

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

describe('GetTeamLeaveRequestsHandler', () => {
  let handler: GetTeamLeaveRequestsHandler;
  let leaveRequestsRepository: LeaveRequestsInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;
  let restaurantId: string;

  const ownerId = 'owner-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTeamLeaveRequestsHandler,
        {
          provide: LEAVE_REQUEST_REPOSITORY,
          useClass: LeaveRequestsInMemoryRepository,
        },
        {
          provide: RESTAURANTS_REPOSITORY,
          useClass: RestaurantsInMemoryRepository,
        },
      ],
    }).compile();

    handler = module.get(GetTeamLeaveRequestsHandler);
    leaveRequestsRepository = module.get(LEAVE_REQUEST_REPOSITORY);
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
    restaurantId = restaurant.id;

    leaveRequestsRepository.employees = [
      { id: 'karim', firstName: 'Karim', lastName: 'Benali', restaurantId },
      { id: 'ines', firstName: 'Inès', lastName: 'Haddad', restaurantId },
      {
        id: 'elsewhere',
        firstName: 'Paul',
        lastName: 'Martin',
        restaurantId: 'other-restaurant',
      },
    ];
  });

  it('throws NotFoundException if the restaurant does not exist', async () => {
    await expect(
      handler.execute(
        new GetTeamLeaveRequestsQuery({ restaurantId: 'unknown', ownerId }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ForbiddenException if the requester is not the owner', async () => {
    await expect(
      handler.execute(
        new GetTeamLeaveRequestsQuery({
          restaurantId,
          ownerId: 'someone-else',
        }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('returns the requests of the restaurant with the employee name', async () => {
    await leaveRequestsRepository.save(
      leave('karim-1', 'karim', 10, 'PENDING'),
    );
    await leaveRequestsRepository.save(
      leave('paul-1', 'elsewhere', 10, 'PENDING'),
    );

    const result = await handler.execute(
      new GetTeamLeaveRequestsQuery({ restaurantId, ownerId }),
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'karim-1',
      firstName: 'Karim',
      lastName: 'Benali',
      status: 'PENDING',
    });
  });

  it('returns old requests too', async () => {
    await leaveRequestsRepository.save(
      leave('recent', 'karim', -60, 'APPROVED'),
    );
    await leaveRequestsRepository.save(leave('old', 'karim', -120, 'APPROVED'));

    const result = await handler.execute(
      new GetTeamLeaveRequestsQuery({ restaurantId, ownerId }),
    );

    expect(result.map((r) => r.id)).toEqual(['recent', 'old']);
  });

  it('returns the most recent requests first', async () => {
    await leaveRequestsRepository.save(
      leave('refused', 'ines', 40, 'REJECTED'),
    );
    await leaveRequestsRepository.save(
      leave('accepted', 'karim', 20, 'APPROVED'),
    );
    await leaveRequestsRepository.save(leave('pending', 'ines', 5, 'PENDING'));

    const result = await handler.execute(
      new GetTeamLeaveRequestsQuery({ restaurantId, ownerId }),
    );

    expect(result.map((r) => r.id)).toEqual(['refused', 'accepted', 'pending']);
  });
});
