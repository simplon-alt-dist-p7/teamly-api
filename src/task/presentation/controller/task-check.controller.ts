import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CheckTaskCommand } from 'src/task/applications/use-cases/commands/check-task/check-task.command';

@Controller('tasks')
export class TaskCheckController {
  constructor(private readonly commandBus: CommandBus) {}

  @UseGuards(AuthGuard)
  @Post(':taskId/check')
  check(@Req() req: AuthenticatedRequest, @Param('taskId') taskId: string) {
    return this.commandBus.execute(
      new CheckTaskCommand({
        taskId,
        userId: req.user.sub,
      }),
    );
  }
}
