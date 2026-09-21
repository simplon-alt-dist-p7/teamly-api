import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { GetMyShiftsQuery } from 'src/shift/applications/use-cases/queries/get-my-shifts.query';
import { GetMyShiftsDto } from '../dto/request/get-my-shifts.dto';

@Controller('shifts')
export class MyShiftsController {
  constructor(private readonly queryBus: QueryBus) {}

  @UseGuards(AuthGuard)
  @Get('me')
  findMine(@Req() req: AuthenticatedRequest, @Query() dto: GetMyShiftsDto) {
    return this.queryBus.execute(
      new GetMyShiftsQuery({
        userId: req.user.sub,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      }),
    );
  }
}
