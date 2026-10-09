import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
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

  async findByRestaurantId(restaurantId: string): Promise<TaskList[]> {
    const rows = await this.prisma.taskList.findMany({
      where: { restaurantId },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
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

  private toDomain(row: {
    id: string;
    restaurantId: string;
    name: string;
    tasks: {
      id: string;
      taskListId: string;
      label: string;
      requiresValidation: boolean;
    }[];
  }): TaskList {
    return new TaskList({
      id: row.id,
      restaurantId: row.restaurantId,
      name: row.name,
      tasks: row.tasks.map(
        (task) =>
          new Task({
            id: task.id,
            taskListId: task.taskListId,
            label: task.label,
            requiresValidation: task.requiresValidation,
          }),
      ),
    });
  }
}
