import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { EMPLOYEES_REPOSITORY } from 'src/employee/data-access/employees.repository';
import {
  TASK_LISTS_REPOSITORY,
  type TaskListsRepository,
} from 'src/task/data-access/task-lists.repository';
import { TaskList } from 'src/task/domain/models/task-list.entity';
import { getCalendarDay } from 'src/task/domain/services/get-calendar-day';
import { GetMyTaskListsQuery } from './get-my-task-lists.query';

@QueryHandler(GetMyTaskListsQuery)
export class GetMyTaskListsHandler implements IQueryHandler<
  GetMyTaskListsQuery,
  TaskList[]
> {
  constructor(
    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: EmployeesRepository,
    @Inject(TASK_LISTS_REPOSITORY)
    private readonly taskListsRepository: TaskListsRepository,
  ) {}

  async execute(query: GetMyTaskListsQuery): Promise<TaskList[]> {
    const employee = await this.employeesRepository.findByUserId(
      query.props.userId,
    );

    if (!employee) {
      throw new NotFoundException('Employé introuvable');
    }

    const day = getCalendarDay(new Date(), 'Europe/Paris');

    return this.taskListsRepository.findByRestaurantId(
      employee.restaurantId,
      day,
    );
  }
}
