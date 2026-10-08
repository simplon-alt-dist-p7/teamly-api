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

  async findByRestaurantId(restaurantId: string): Promise<TaskList[]> {
    const rows = await this.prisma.taskList.findMany({
      where: { restaurantId },
      include: { tasks: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: {
    id: string;
    restaurantId: string;
    name: string;
    tasks: { id: string; taskListId: string; label: string }[];
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
          }),
      ),
    });
  }
}
