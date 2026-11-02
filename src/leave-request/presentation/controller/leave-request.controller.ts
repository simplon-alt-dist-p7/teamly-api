import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CreateLeaveRequestCommand } from '../../applications/use-cases/commands/create-leave-request/create-leave-request.command';
import { GetMyLeaveRequestsQuery } from '../../applications/use-cases/queries/get-my-leave-requests.query';
import { CreateLeaveRequestDto } from '../dto/request/create-leave-request.dto';

@Controller('leave-requests')
export class LeaveRequestController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() dto: CreateLeaveRequestDto, @Req() req: AuthenticatedRequest) {
    return this.commandBus.execute(
      new CreateLeaveRequestCommand(
        req.user.sub,
        new Date(dto.startDate),
        new Date(dto.endDate),
      ),
    );
  }

  @UseGuards(AuthGuard)
  @Get('me')
  findMine(@Req() req: AuthenticatedRequest) {
    return this.queryBus.execute(new GetMyLeaveRequestsQuery(req.user.sub));
  }
}
