import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { UpdateShiftCommand } from 'src/shift/applications/use-cases/commands/update-shift/update-shift.command';
import { CreateShiftCommand } from '../../applications/use-cases/commands/create-shift/create-shift.command';
import { CreateShiftDto } from '../dto/request/create-shift-dtos';
import { UpdateShiftDto } from '../dto/request/update-shift.dto';

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

  @UseGuards(AuthGuard)
  @Patch(':shiftId')
  update(
    @Param('shiftId') shiftId: string,
    @Body() dto: UpdateShiftDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.commandBus.execute(
      new UpdateShiftCommand(
        shiftId,
        new Date(dto.startTime),
        new Date(dto.endTime),
        req.user.sub,
      ),
    );
  }
}
