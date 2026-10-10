import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { TaskListsInMemoryRepository } from 'src/task/data-access/adapters/task-lists-in-memory.repository';
import { TASK_LISTS_REPOSITORY } from 'src/task/data-access/task-lists.repository';
import { TaskCheck } from 'src/task/domain/models/task-check.entity';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { Task } from 'src/task/domain/models/task.entity';
import { getCalendarDay } from 'src/task/domain/services/get-calendar-day';
import { GetMyTaskListsHandler } from '../../use-cases/queries/get-my-task-lists.handler';
import { GetMyTaskListsQuery } from '../../use-cases/queries/get-my-task-lists.query';

describe('GetMyTaskListsHandler', () => {
  let handler: GetMyTaskListsHandler;
  let taskListsRepository: TaskListsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMyTaskListsHandler,
        {
          provide: TASK_LISTS_REPOSITORY,
          useClass: TaskListsInMemoryRepository,
        },
        {
          provide: EMPLOYEES_REPOSITORY,
          useClass: EmployeesInMemoryRepository,
        },
      ],
    }).compile();

    handler = module.get(GetMyTaskListsHandler);
    taskListsRepository = module.get(TASK_LISTS_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
  });

  it('throws NotFoundException if the user has no employee', async () => {
    await expect(
      handler.execute(new GetMyTaskListsQuery({ userId: 'owner-1' })),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns only the task lists of the employee restaurant', async () => {
    const employee = await employeesRepository.create({
      userId: 'user-1',
      restaurantId: 'resto-1',
      firstName: 'Alice',
      lastName: 'Martin',
    });
    const opening = new TaskList({
      id: 'list-1',
      restaurantId: employee.restaurantId,
      name: 'Ouverture',
      tasks: [
        new Task({
          id: 'task-1',
          taskListId: 'list-1',
          label: 'Allumer la machine à café',
          requiresValidation: false,
        }),
      ],
    });
    const closing = new TaskList({
      id: 'list-2',
      restaurantId: 'resto-2',
      name: 'Fermeture',
      tasks: [
        new Task({
          id: 'task-2',
          taskListId: 'list-2',
          label: 'Sortir les poubelles',
          requiresValidation: false,
        }),
      ],
    });
    await taskListsRepository.save(opening);
    await taskListsRepository.save(closing);

    const result = await handler.execute(
      new GetMyTaskListsQuery({ userId: 'user-1' }),
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(opening.id);
    expect(result[0].name).toBe('Ouverture');
    expect(result[0].tasks[0].label).toBe('Allumer la machine à café');
    expect(result[0].tasks[0].todayCheck).toBeNull();
  });

  it('returns the check of today and ignores a check from another day', async () => {
    const employee = await employeesRepository.create({
      userId: 'user-1',
      restaurantId: 'resto-1',
      firstName: 'Alice',
      lastName: 'Martin',
    });
    await taskListsRepository.save(
      new TaskList({
        id: 'list-1',
        restaurantId: employee.restaurantId,
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
            label: 'Sortir les poubelles',
            requiresValidation: true,
          }),
        ],
      }),
    );
    const today = getCalendarDay(new Date(), 'Europe/Paris');
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const checkedAt = new Date('2026-10-10T07:12:00.000Z');
    await taskListsRepository.addTaskCheck(
      new TaskCheck({
        id: 'check-today',
        taskId: 'task-1',
        employeeId: employee.id,
        day: today,
        checkedAt,
      }),
    );
    await taskListsRepository.addTaskCheck(
      new TaskCheck({
        id: 'check-yesterday',
        taskId: 'task-2',
        employeeId: employee.id,
        day: yesterday,
        checkedAt,
      }),
    );

    const result = await handler.execute(
      new GetMyTaskListsQuery({ userId: 'user-1' }),
    );

    expect(result[0].tasks[0].todayCheck?.checkedAt).toEqual(checkedAt);
    expect(result[0].tasks[1].todayCheck).toBeNull();
  });

  it('returns an empty array when the restaurant has no task list', async () => {
    await employeesRepository.create({
      userId: 'user-1',
      restaurantId: 'resto-1',
      firstName: 'Alice',
      lastName: 'Martin',
    });

    const result = await handler.execute(
      new GetMyTaskListsQuery({ userId: 'user-1' }),
    );

    expect(result).toEqual([]);
  });
});
