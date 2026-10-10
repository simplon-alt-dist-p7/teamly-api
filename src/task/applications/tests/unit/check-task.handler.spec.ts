import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesInMemoryRepository } from 'src/employee/data-access/adapters/employees-in-memory.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import { TaskListsInMemoryRepository } from 'src/task/data-access/adapters/task-lists-in-memory.repository';
import { TASK_LISTS_REPOSITORY } from 'src/task/data-access/task-lists.repository';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { Task } from 'src/task/domain/models/task.entity';
import { getCalendarDay } from 'src/task/domain/services/get-calendar-day';
import { CheckTaskCommand } from '../../use-cases/commands/check-task/check-task.command';
import { CheckTaskHandler } from '../../use-cases/commands/check-task/check-task.handler';

describe('CheckTaskHandler', () => {
  let handler: CheckTaskHandler;
  let taskListsRepository: TaskListsInMemoryRepository;
  let employeesRepository: EmployeesInMemoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckTaskHandler,
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

    handler = module.get(CheckTaskHandler);
    taskListsRepository = module.get(TASK_LISTS_REPOSITORY);
    employeesRepository = module.get(EMPLOYEES_REPOSITORY);
  });

  const createEmployeeWithTask = async (requiresValidation: boolean) => {
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
            requiresValidation,
          }),
        ],
      }),
    );

    return employee;
  };

  it('records the check when the task requires validation', async () => {
    const employee = await createEmployeeWithTask(true);

    const result = await handler.execute(
      new CheckTaskCommand({ taskId: 'task-1', userId: 'user-1' }),
    );

    expect(result.taskId).toBe('task-1');
    expect(result.employeeId).toBe(employee.id);
    expect(result.day).toEqual(getCalendarDay(new Date(), 'Europe/Paris'));
    expect(taskListsRepository.taskChecks).toEqual([result]);
  });

  it('throws NotFoundException if the user has no employee', async () => {
    await expect(
      handler.execute(
        new CheckTaskCommand({ taskId: 'task-1', userId: 'user-1' }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if the task is not in the employee restaurant', async () => {
    await createEmployeeWithTask(true);
    await taskListsRepository.save(
      new TaskList({
        id: 'list-2',
        restaurantId: 'resto-2',
        name: 'Fermeture',
        tasks: [
          new Task({
            id: 'task-2',
            taskListId: 'list-2',
            label: 'Sortir les poubelles',
            requiresValidation: true,
          }),
        ],
      }),
    );

    await expect(
      handler.execute(
        new CheckTaskCommand({ taskId: 'task-2', userId: 'user-1' }),
      ),
    ).rejects.toThrow(NotFoundException);
    expect(taskListsRepository.taskChecks).toHaveLength(0);
  });

  it('throws BadRequestException if the task does not require validation', async () => {
    await createEmployeeWithTask(false);

    await expect(
      handler.execute(
        new CheckTaskCommand({ taskId: 'task-1', userId: 'user-1' }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(taskListsRepository.taskChecks).toHaveLength(0);
  });

  it('throws ConflictException if the task is already checked today', async () => {
    await createEmployeeWithTask(true);
    const command = new CheckTaskCommand({
      taskId: 'task-1',
      userId: 'user-1',
    });

    await handler.execute(command);

    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
    expect(taskListsRepository.taskChecks).toHaveLength(1);
  });
});
