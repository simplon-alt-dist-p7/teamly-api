import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { EmployeeModule } from 'src/employee/employee.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { AddTaskHandler } from './applications/use-cases/commands/add-task/add-task.handler';
import { CreateTaskListHandler } from './applications/use-cases/commands/create-task-list/create-task-list.handler';
import { RemoveTaskHandler } from './applications/use-cases/commands/remove-task/remove-task.handler';
import { GetMyTaskListsHandler } from './applications/use-cases/queries/get-my-task-lists.handler';
import { GetTaskListsByRestaurantHandler } from './applications/use-cases/queries/get-task-lists-by-restaurant.handler';
import { TaskListsPrismaRepository } from './data-access/adapters/task-lists-prisma.repository';
import { TASK_LISTS_REPOSITORY } from './data-access/task-lists.repository';
import { MyTaskListsController } from './presentation/controller/my-task-lists.controller';
import { TaskListController } from './presentation/controller/task-list.controller';

@Module({
  imports: [CqrsModule, PrismaModule, RestaurantModule, EmployeeModule],
  providers: [
    { provide: TASK_LISTS_REPOSITORY, useClass: TaskListsPrismaRepository },
    CreateTaskListHandler,
    AddTaskHandler,
    RemoveTaskHandler,
    GetTaskListsByRestaurantHandler,
    GetMyTaskListsHandler,
  ],
  controllers: [TaskListController, MyTaskListsController],
})
export class TaskModule {}
