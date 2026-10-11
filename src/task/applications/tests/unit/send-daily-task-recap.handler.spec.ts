import { Test, TestingModule } from '@nestjs/testing';
import { EmailMessage, EMAIL_SENDER } from 'src/email/email-sender';
import { RestaurantsInMemoryRepository } from 'src/restaurant/data-access/adapters/restaurants-in-memory.repository';
import { RESTAURANTS_REPOSITORY } from 'src/restaurant/data-access/restaurants.repository';
import { TaskListsInMemoryRepository } from 'src/task/data-access/adapters/task-lists-in-memory.repository';
import { TASK_LISTS_REPOSITORY } from 'src/task/data-access/task-lists.repository';
import { TaskCheck } from 'src/task/domain/models/task-check.entity';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { Task } from 'src/task/domain/models/task.entity';
import { SendDailyTaskRecapCommand } from '../../use-cases/commands/send-daily-task-recap/send-daily-task-recap.command';
import { SendDailyTaskRecapHandler } from '../../use-cases/commands/send-daily-task-recap/send-daily-task-recap.handler';

describe('SendDailyTaskRecapHandler', () => {
  let handler: SendDailyTaskRecapHandler;
  let restaurantsRepository: RestaurantsInMemoryRepository;
  let taskListsRepository: TaskListsInMemoryRepository;
  let send: jest.Mock<Promise<void>, [EmailMessage]>;

  const day = new Date('2026-10-11T00:00:00.000Z');

  beforeEach(async () => {
    send = jest.fn<Promise<void>, [EmailMessage]>().mockResolvedValue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendDailyTaskRecapHandler,
        {
          provide: TASK_LISTS_REPOSITORY,
          useClass: TaskListsInMemoryRepository,
        },
        {
          provide: RESTAURANTS_REPOSITORY,
          useClass: RestaurantsInMemoryRepository,
        },
        {
          provide: EMAIL_SENDER,
          useValue: { send },
        },
      ],
    }).compile();

    handler = module.get(SendDailyTaskRecapHandler);
    restaurantsRepository = module.get(RESTAURANTS_REPOSITORY);
    taskListsRepository = module.get(TASK_LISTS_REPOSITORY);
  });

  it('sends one email per restaurant that has tasks to validate', async () => {
    const restaurant = await restaurantsRepository.create(
      {
        name: 'Le Bistrot',
        address: '1 rue de Paris',
        phone: '0612345678',
        email: 'owner@test.com',
      },
      'owner-1',
    );
    await restaurantsRepository.create(
      {
        name: 'Sans tâches',
        address: '2 rue de Paris',
        phone: '0612345678',
        email: 'empty@test.com',
      },
      'owner-2',
    );
    await taskListsRepository.save(
      new TaskList({
        id: 'list-1',
        restaurantId: restaurant.id,
        name: 'Ouverture',
        tasks: [
          new Task({
            id: 'task-1',
            taskListId: 'list-1',
            label: 'Allumer la machine à café',
            requiresValidation: true,
          }),
          new Task({
            id: 'task-2',
            taskListId: 'list-1',
            label: 'Sortir les chaises',
            requiresValidation: false,
          }),
        ],
      }),
    );
    taskListsRepository.taskChecks.push(
      new TaskCheck({
        id: 'check-1',
        taskId: 'task-1',
        employeeId: 'employee-1',
        day,
        checkedAt: new Date('2026-10-11T07:12:00.000Z'),
      }),
    );

    await handler.execute(new SendDailyTaskRecapCommand({ day }));

    expect(send).toHaveBeenCalledTimes(1);
    const message = send.mock.calls[0][0];
    expect(message.to).toBe('owner@test.com');
    expect(message.subject).toBe('Tâches du Dimanche 11 octobre');
    expect(message.text).toContain('Allumer la machine à café : faite par');
    expect(message.text).toContain('09:12');
    expect(message.text).not.toContain('Sortir les chaises');
    expect(message.text).not.toContain('Sans tâches');
  });

  it('keeps sending when one email fails', async () => {
    await restaurantsRepository.create(
      {
        name: 'Premier',
        address: '1 rue de Paris',
        phone: '0612345678',
        email: 'first@test.com',
      },
      'owner-1',
    );
    await restaurantsRepository.create(
      {
        name: 'Second',
        address: '2 rue de Paris',
        phone: '0612345678',
        email: 'second@test.com',
      },
      'owner-2',
    );
    const restaurants = await restaurantsRepository.findAll();
    for (const restaurant of restaurants) {
      await taskListsRepository.save(
        new TaskList({
          id: `list-${restaurant.id}`,
          restaurantId: restaurant.id,
          name: 'Ouverture',
          tasks: [
            new Task({
              id: `task-${restaurant.id}`,
              taskListId: `list-${restaurant.id}`,
              label: 'Allumer la machine à café',
              requiresValidation: true,
            }),
          ],
        }),
      );
    }
    send.mockRejectedValueOnce(new Error('smtp down'));

    await handler.execute(new SendDailyTaskRecapCommand({ day }));

    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].to).toBe('second@test.com');
  });
});
