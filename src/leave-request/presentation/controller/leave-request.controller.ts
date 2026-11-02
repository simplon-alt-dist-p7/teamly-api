import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CreateLeaveRequestCommand } from '../../applications/use-cases/commands/create-leave-request/create-leave-request.command';
import { CreateLeaveRequestDto } from '../dto/request/create-leave-request.dto';

@Controller('leave-requests')
export class LeaveRequestController {
  constructor(private readonly commandBus: CommandBus) {}

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
}
