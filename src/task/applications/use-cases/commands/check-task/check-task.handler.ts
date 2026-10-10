import {
  BadRequestException,
  ConflictException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  TASK_LISTS_REPOSITORY,
  type TaskListsRepository,
} from 'src/task/data-access/task-lists.repository';
import { TaskCheck } from 'src/task/domain/models/task-check.entity';
import { Task } from 'src/task/domain/models/task.entity';
import { getCalendarDay } from 'src/task/domain/services/get-calendar-day';
import { CheckTaskCommand } from './check-task.command';

@CommandHandler(CheckTaskCommand)
export class CheckTaskHandler implements ICommandHandler<
  CheckTaskCommand,
  TaskCheck
> {
  constructor(
    @Inject(TASK_LISTS_REPOSITORY)
    private readonly taskListsRepository: TaskListsRepository,
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
  ) {}

  async execute(command: CheckTaskCommand): Promise<TaskCheck> {
    const { taskId, userId } = command.props;

    const employee = await this.employeesRepository.findByUserId(userId);
    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const taskLists = await this.taskListsRepository.findByRestaurantId(
      employee.restaurantId,
    );

    let task: Task | undefined;

    for (const currentList of taskLists) {
      task = currentList.tasks.find((currentTask) => currentTask.id === taskId);
      if (task) {
        break;
      }
    }

    if (!task) {
      throw new NotFoundException('Tâche introuvable');
    }

    if (!task.requiresValidation) {
      throw new BadRequestException("Cette tâche n'est pas à valider");
    }

    const day = getCalendarDay(new Date(), 'Europe/Paris');
    const existingCheck = await this.taskListsRepository.findTaskCheck(
      taskId,
      day,
    );
    if (existingCheck) {
      throw new ConflictException("Cette tâche est déjà validée aujourd'hui");
    }

    const taskCheck = new TaskCheck({
      id: randomUUID(),
      taskId,
      employeeId: employee.id,
      day,
      checkedAt: new Date(),
    });

    await this.taskListsRepository.addTaskCheck(taskCheck);
    return taskCheck;
  }
}
