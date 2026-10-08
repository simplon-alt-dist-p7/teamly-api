import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TaskList } from '../../domain/models/task-list.entity';
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
}
