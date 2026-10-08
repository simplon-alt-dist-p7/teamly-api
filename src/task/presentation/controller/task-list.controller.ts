import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CreateTaskListCommand } from 'src/task/applications/use-cases/commands/create-task-list/create-task-list.command';
import { GetTaskListsByRestaurantQuery } from 'src/task/applications/use-cases/queries/get-task-lists-by-restaurant.query';
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
}
