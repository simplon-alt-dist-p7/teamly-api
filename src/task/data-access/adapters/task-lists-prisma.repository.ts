import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TaskCheck } from 'src/task/domain/models/task-check.entity';
import { TaskList } from '../../domain/models/task-list.entity';
import { Task } from '../../domain/models/task.entity';
import { TaskListsRepository } from '../task-lists.repository';

@Injectable()
export class TaskListsPrismaRepository implements TaskListsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(taskList: TaskList): Promise<void> {
    await this.prisma.taskList.create({
      data: {
        id: taskList.id,
        restaurantId: taskList.restaurantId,
        name: taskList.name,
      },
    });
  }

  async findById(id: string): Promise<TaskList | null> {
    const row = await this.prisma.taskList.findUnique({
      where: { id },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByRestaurantId(
    restaurantId: string,
    day?: Date,
  ): Promise<TaskList[]> {
    const rows = await this.prisma.taskList.findMany({
      where: { restaurantId },
      include: {
        tasks: {
          orderBy: { createdAt: 'asc' },
          include: day
            ? {
                taskChecks: {
                  where: { day },
                  include: { employee: true },
                },
              }
            : undefined,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async addTask(task: Task): Promise<void> {
    await this.prisma.task.create({
      data: {
        id: task.id,
        taskListId: task.taskListId,
        label: task.label,
        requiresValidation: task.requiresValidation,
      },
    });
  }

  async removeTask(taskId: string): Promise<void> {
    await this.prisma.task.delete({
      where: { id: taskId },
    });
  }

  async findTaskCheck(taskId: string, day: Date): Promise<TaskCheck | null> {
    const row = await this.prisma.taskCheck.findUnique({
      where: { taskId_day: { taskId, day } },
    });

    if (!row) {
      return null;
    }

    return new TaskCheck({
      id: row.id,
      taskId: row.taskId,
      employeeId: row.employeeId,
      day: row.day,
      checkedAt: row.checkedAt,
    });
  }

  async addTaskCheck(taskCheck: TaskCheck): Promise<void> {
    await this.prisma.taskCheck.create({
      data: {
        id: taskCheck.id,
        taskId: taskCheck.taskId,
        employeeId: taskCheck.employeeId,
        day: taskCheck.day,
        checkedAt: taskCheck.checkedAt,
      },
    });
  }

  private toDomain(row: {
    id: string;
    restaurantId: string;
    name: string;
    tasks: {
      id: string;
      taskListId: string;
      label: string;
      requiresValidation: boolean;
      taskChecks?: {
        checkedAt: Date;
        employee: { firstName: string; lastName: string };
      }[];
    }[];
  }): TaskList {
    return new TaskList({
      id: row.id,
      restaurantId: row.restaurantId,
      name: row.name,
      tasks: row.tasks.map((task) => {
        const taskCheck = task.taskChecks?.[0];

        return new Task({
          id: task.id,
          taskListId: task.taskListId,
          label: task.label,
          requiresValidation: task.requiresValidation,
          todayCheck: task.taskChecks
            ? taskCheck
              ? {
                  employeeFirstName: taskCheck.employee.firstName,
                  employeeLastName: taskCheck.employee.lastName,
                  checkedAt: taskCheck.checkedAt,
                }
              : null
            : undefined,
        });
      }),
    });
  }
}
