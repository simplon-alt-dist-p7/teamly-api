import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { TaskListsInMemoryRepository } from 'src/task/data-access/adapters/task-lists-in-memory.repository';
import { TASK_LISTS_REPOSITORY } from 'src/task/data-access/task-lists.repository';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { Task } from 'src/task/domain/models/task.entity';
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

    expect(result).toEqual([opening]);
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
