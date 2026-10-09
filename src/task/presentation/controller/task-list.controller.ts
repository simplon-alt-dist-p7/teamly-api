import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { AddTaskCommand } from 'src/task/applications/use-cases/commands/add-task/add-task.command';
import { CreateTaskListCommand } from 'src/task/applications/use-cases/commands/create-task-list/create-task-list.command';
import { RemoveTaskCommand } from 'src/task/applications/use-cases/commands/remove-task/remove-task.command';
import { GetTaskListsByRestaurantQuery } from 'src/task/applications/use-cases/queries/get-task-lists-by-restaurant.query';
import { AddTaskDto } from '../dto/request/add-task.dto';
import { CreateTaskListDto } from '../dto/request/create-task-list.dto';

@Controller('restaurant/:restaurantId/task-lists')
export class TaskListController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  findByRestaurantId(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.queryBus.execute(
      new GetTaskListsByRestaurantQuery({
        restaurantId,
        ownerId: req.user.sub,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateTaskListDto,
  ) {
    return this.commandBus.execute(
      new CreateTaskListCommand({
        restaurantId,
        name: dto.name,
        ownerId: req.user.sub,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Post(':taskListId/tasks')
  addTask(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Param('taskListId') taskListId: string,
    @Body() dto: AddTaskDto,
  ) {
    return this.commandBus.execute(
      new AddTaskCommand({
        restaurantId,
        taskListId,
        label: dto.label,
        ownerId: req.user.sub,
        requiresValidation: dto.requiresValidation,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':taskListId/tasks/:taskId')
  @HttpCode(204)
  removeTask(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Param('taskListId') taskListId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.commandBus.execute(
      new RemoveTaskCommand({
        restaurantId,
        taskListId,
        taskId,
        ownerId: req.user.sub,
      }),
    );
  }
}
