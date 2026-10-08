import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { AddTaskHandler } from './applications/use-cases/commands/add-task/add-task.handler';
import { CreateTaskListHandler } from './applications/use-cases/commands/create-task-list/create-task-list.handler';
import { GetTaskListsByRestaurantHandler } from './applications/use-cases/queries/get-task-lists-by-restaurant.handler';
import { TaskListsPrismaRepository } from './data-access/adapters/task-lists-prisma.repository';
import { TASK_LISTS_REPOSITORY } from './data-access/task-lists.repository';
import { TaskListController } from './presentation/controller/task-list.controller';

@Module({
  imports: [CqrsModule, PrismaModule, RestaurantModule],
  providers: [
    { provide: TASK_LISTS_REPOSITORY, useClass: TaskListsPrismaRepository },
    CreateTaskListHandler,
    AddTaskHandler,
    GetTaskListsByRestaurantHandler,
  ],
  controllers: [TaskListController],
})
export class TaskModule {}
