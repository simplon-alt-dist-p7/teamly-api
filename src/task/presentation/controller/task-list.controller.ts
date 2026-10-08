import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CreateTaskListCommand } from 'src/task/applications/use-cases/commands/create-task-list/create-task-list.command';
import { CreateTaskListDto } from '../dto/request/create-task-list.dto';

@Controller('restaurant/:restaurantId/task-lists')
export class TaskListController {
  constructor(private readonly commandBus: CommandBus) {}

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
