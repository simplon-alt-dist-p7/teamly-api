import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CreateShiftCommand } from '../../applications/use-cases/commands/create-shift/create-shift.command';
import { CreateShiftDto } from '../dto/request/create-shift-dtos';

@Controller('employees/:employeeId/shifts')
export class ShiftController {
  constructor(private readonly commandBus: CommandBus) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() dto: CreateShiftDto,
    @Req() req: AuthenticatedRequest,
    @Param('employeeId') employeeId: string,
  ) {
    return this.commandBus.execute(
      new CreateShiftCommand(
        employeeId,
        new Date(dto.startTime),
        new Date(dto.endTime),
        req.user.sub,
      ),
    );
  }
}
