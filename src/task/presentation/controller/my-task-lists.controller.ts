import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { GetMyTaskListsQuery } from 'src/task/applications/use-cases/queries/get-my-task-lists.query';

@Controller('task-lists')
export class MyTaskListsController {
  constructor(private readonly queryBus: QueryBus) {}

  @UseGuards(AuthGuard)
  @Get('me')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.queryBus.execute(
      new GetMyTaskListsQuery({
        userId: req.user.sub,
      }),
    );
  }
}
