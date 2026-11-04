import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { LeaveRequestsInMemoryRepository } from 'src/leave-request/data-access/adapters/leave-requests-in-memory.repository';
import { LEAVE_REQUEST_REPOSITORY } from 'src/leave-request/data-access/leave-requests.repository';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { ShiftsInMemoryRepository } from 'src/shift/data-access/adapters/shifts-in-memory.repository';
import { SHIFT_REPOSITORY } from 'src/shift/data-access/shifts.repository';
import { CreateShiftCommand } from '../../use-cases/commands/create-shift/create-shift.command';
import { CreateShiftHandler } from '../../use-cases/commands/create-shift/create-shift.handler';
import { DeleteShiftCommand } from '../../use-cases/commands/delete-shift/delete-shift.command';
import { DeleteShiftHandler } from '../../use-cases/commands/delete-shift/delete-shift.handler';
import { UpdateShiftCommand } from '../../use-cases/commands/update-shift/update-shift.command';
import { UpdateShiftHandler } from '../../use-cases/commands/update-shift/update-shift.handler';
import { GetPartnerPlanningHandler } from '../../use-cases/queries/get-partner-planning.handler';
import { GetPartnerPlanningQuery } from '../../use-cases/queries/get-partner-planning.query';

describe('Partner planning', () => {
  let createHandler: CreateShiftHandler;
  let updateHandler: UpdateShiftHandler;
  let deleteHandler: DeleteShiftHandler;
  let planningHandler: GetPartnerPlanningHandler;
  let shiftsRepository: ShiftsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;
  let restaurantsRepository: RestaurantsInMemoryRepository;

  const ownerId = 'owner-1';
  const restaurantData = {
    name: 'Planning associés',
    address: '1 allée du Berry',
    phone: '+33612345678',
    email: 'planningassocie@test.com',
  };
  const start = new Date('2026-11-04T16:00:00.000Z');
  const end = new Date('2026-11-04T17:30:00.000Z');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateShiftHandler,
        UpdateShiftHandler,
        DeleteShiftHandler,
        GetPartnerPlanningHandler,
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

    createHandler = module.get(CreateShiftHandler);
    updateHandler = module.get(UpdateShiftHandler);
    deleteHandler = module.get(DeleteShiftHandler);
    planningHandler = module.get(GetPartnerPlanningHandler);
    shiftsRepository = module.get(SHIFT_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
  });

  afterEach(() => {
    delete process.env.PARTNER_PLANNING_RESTAURANT_ID;
  });

  async function setupPartners() {
    const restaurant = await restaurantsRepository.create(
      restaurantData,
      ownerId,
    );
    process.env.PARTNER_PLANNING_RESTAURANT_ID = restaurant.id;
    const sofiane = await employeesRepository.create({
      userId: 'user-sofiane',
      restaurantId: restaurant.id,
      firstName: 'Sofiane',
      lastName: 'Haddad',
    });
    const yanis = await employeesRepository.create({
      userId: 'user-yanis',
      restaurantId: restaurant.id,
      firstName: 'Yanis',
      lastName: 'Ferreira',
    });
    return { sofiane, yanis };
  }

  it('lets a partner add his own shift with a note', async () => {
    const { sofiane } = await setupPartners();

    const shift = await createHandler.execute(
      new CreateShiftCommand(
        sofiane.id,
        start,
        end,
        'user-sofiane',
        'Metro : boissons',
      ),
    );

    expect(shift.employeeId).toBe(sofiane.id);
    expect(shift.note).toBe('Metro : boissons');
  });

  it('forbids a partner to add a shift for another partner', async () => {
    const { yanis } = await setupPartners();

    await expect(
      createHandler.execute(
        new CreateShiftCommand(yanis.id, start, end, 'user-sofiane'),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('forbids a partner to change or delete the shift of another partner', async () => {
    const { yanis } = await setupPartners();
    const shift = await createHandler.execute(
      new CreateShiftCommand(yanis.id, start, end, ownerId),
    );

    await expect(
      updateHandler.execute(
        new UpdateShiftCommand(shift.id, start, end, 'user-sofiane'),
      ),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      deleteHandler.execute(new DeleteShiftCommand(shift.id, 'user-sofiane')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('keeps the note when an update does not send one', async () => {
    const { sofiane } = await setupPartners();
    const shift = await createHandler.execute(
      new CreateShiftCommand(sofiane.id, start, end, 'user-sofiane', 'Banque'),
    );

    const later = new Date('2026-11-04T18:00:00.000Z');
    const updated = await updateHandler.execute(
      new UpdateShiftCommand(shift.id, start, later, 'user-sofiane'),
    );

    expect(updated.note).toBe('Banque');
  });

  it('forbids employees of other restaurants to edit their own shifts', async () => {
    const restaurant = await restaurantsRepository.create(
      restaurantData,
      ownerId,
    );
    const employee = await employeesRepository.create({
      userId: 'user-alice',
      restaurantId: restaurant.id,
      firstName: 'Alice',
      lastName: 'Martin',
    });

    await expect(
      createHandler.execute(
        new CreateShiftCommand(employee.id, start, end, 'user-alice'),
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('gives a partner the planning of all partners', async () => {
    const { sofiane, yanis } = await setupPartners();
    await createHandler.execute(
      new CreateShiftCommand(yanis.id, start, end, ownerId),
    );

    const planning = await planningHandler.execute(
      new GetPartnerPlanningQuery({ userId: 'user-sofiane' }),
    );

    expect(planning.myEmployeeId).toBe(sofiane.id);
    expect(planning.partners.map((partner) => partner.firstName)).toEqual([
      'Sofiane',
      'Yanis',
    ]);
    expect(planning.shifts).toHaveLength(shiftsRepository.shifts.length);
  });

  it('refuses the partner planning to other employees', async () => {
    await setupPartners();
    delete process.env.PARTNER_PLANNING_RESTAURANT_ID;

    await expect(
      planningHandler.execute(
        new GetPartnerPlanningQuery({ userId: 'user-sofiane' }),
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
