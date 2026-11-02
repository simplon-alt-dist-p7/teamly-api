import { ConflictException } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
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
import { ShiftsInMemoryRepository } from 'src/shift/data-access/adapters/shifts-in-memory.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { CreateShiftCommand } from '../../use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from '../../use-cases/commands/create-shift/create-shift.handler';
import { DuplicateWeekCommand } from '../../use-cases/commands/duplicate-week/duplicate-shift.command';
import { DuplicateWeekHandler } from '../../use-cases/commands/duplicate-week/duplicate-shift.handler';
import { UpdateShiftCommand } from '../../use-cases/commands/update-shift/update-shift.command';
import { UpdateShiftHandler } from '../../use-cases/commands/update-shift/update-shift.handler';

// Karim is on leave from Monday 24 to Wednesday 26 August 2026.
describe('Shifts during an approved leave', () => {
  let createHandler: CreateShiftHandler;
  let updateHandler: UpdateShiftHandler;
  let duplicateHandler: DuplicateWeekHandler;
  let shiftsRepository: ShiftsInMemoryRepository;
  let leaveRequestsRepository: LeaveRequestsInMemoryRepository;
  let restaurantId: string;
  let karimId: string;

  const ownerId = 'owner-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        CreateShiftHandler,
        UpdateShiftHandler,
        DuplicateWeekHandler,
        { provide: SHIFT_REPOSITORY, useClass: ShiftsInMemoryRepository },
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
    await module.init();

    createHandler = module.get(CreateShiftHandler);
    updateHandler = module.get(UpdateShiftHandler);
    duplicateHandler = module.get(DuplicateWeekHandler);
    shiftsRepository = module.get(SHIFT_REPOSITORY);
    leaveRequestsRepository = module.get(LEAVE_REQUEST_REPOSITORY);
    const employeesRepository: EmployeesInMemoryRepository =
      module.get(EMPLOYEES_REPOSITORY);
    const restaurantsRepository: RestaurantsInMemoryRepository = module.get(
      RESTAURANTS_REPOSITORY,
    );

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
    const karim = await employeesRepository.create({
      userId: 'user-1',
      restaurantId,
      firstName: 'Karim',
      lastName: 'Benali',
    });
    karimId = karim.id;
  });

  async function saveLeave(status: LeaveStatus) {
    await leaveRequestsRepository.save(
      new LeaveRequest({
        id: 'leave-1',
        employeeId: karimId,
        startDate: new Date('2026-08-24'),
        endDate: new Date('2026-08-26'),
        status,
        createdAt: new Date(),
      }),
    );
  }

  it('a shift cannot be created on a day the employee is on approved leave', async () => {
    await saveLeave('APPROVED');

    await expect(
      createHandler.execute(
        new CreateShiftCommand(
          karimId,
          new Date('2026-08-25T16:00:00.000Z'),
          new Date('2026-08-25T21:00:00.000Z'),
          ownerId,
        ),
      ),
    ).rejects.toThrow('Karim est en congé le mardi 25 août.');
    expect(shiftsRepository.shifts).toHaveLength(0);
  });

  it('a pending leave does not block the shift', async () => {
    await saveLeave('PENDING');

    await createHandler.execute(
      new CreateShiftCommand(
        karimId,
        new Date('2026-08-25T16:00:00.000Z'),
        new Date('2026-08-25T21:00:00.000Z'),
        ownerId,
      ),
    );

    expect(shiftsRepository.shifts).toHaveLength(1);
  });

  it('uses the Paris day: a shift at 00:30 on Monday 24 is blocked', async () => {
    await saveLeave('APPROVED');

    await expect(
      createHandler.execute(
        new CreateShiftCommand(
          karimId,
          new Date('2026-08-23T22:30:00.000Z'), // Monday 24, 00:30 in Paris
          new Date('2026-08-24T02:00:00.000Z'),
          ownerId,
        ),
      ),
    ).rejects.toThrow('Karim est en congé le lundi 24 août.');
  });

  it('uses the Paris day: a shift at 00:30 on Thursday 27 is allowed', async () => {
    await saveLeave('APPROVED');

    await createHandler.execute(
      new CreateShiftCommand(
        karimId,
        new Date('2026-08-26T22:30:00.000Z'), // Thursday 27, 00:30 in Paris
        new Date('2026-08-27T02:00:00.000Z'),
        ownerId,
      ),
    );

    expect(shiftsRepository.shifts).toHaveLength(1);
  });

  it('a shift cannot be moved to a day the employee is on approved leave', async () => {
    const shift = await createHandler.execute(
      new CreateShiftCommand(
        karimId,
        new Date('2026-08-27T16:00:00.000Z'),
        new Date('2026-08-27T21:00:00.000Z'),
        ownerId,
      ),
    );
    await saveLeave('APPROVED');

    await expect(
      updateHandler.execute(
        new UpdateShiftCommand(
          shift.id,
          new Date('2026-08-26T16:00:00.000Z'),
          new Date('2026-08-26T21:00:00.000Z'),
          ownerId,
        ),
      ),
    ).rejects.toThrow(ConflictException);
    expect(shiftsRepository.shifts[0].startTime).toEqual(
      new Date('2026-08-27T16:00:00.000Z'),
    );
  });

  it('copying a week skips the shifts that fall on an approved leave day and says how many', async () => {
    // Week of 17 August: Monday 17 and Thursday 20.
    await createHandler.execute(
      new CreateShiftCommand(
        karimId,
        new Date('2026-08-17T16:00:00.000Z'),
        new Date('2026-08-17T21:00:00.000Z'),
        ownerId,
      ),
    );
    await createHandler.execute(
      new CreateShiftCommand(
        karimId,
        new Date('2026-08-20T16:00:00.000Z'),
        new Date('2026-08-20T21:00:00.000Z'),
        ownerId,
      ),
    );
    await saveLeave('APPROVED');

    const result = await duplicateHandler.execute(
      new DuplicateWeekCommand({
        restaurantId,
        referenceDate: new Date('2026-08-19T12:00:00.000Z'),
        ownerId,
      }),
    );

    // Monday 24 is during the leave, Thursday 27 is not.
    expect(result).toEqual({ skipped: 1 });
    expect(shiftsRepository.shifts.map((s) => s.startTime)).toContainEqual(
      new Date('2026-08-27T16:00:00.000Z'),
    );
    expect(shiftsRepository.shifts).toHaveLength(3);
  });
});
