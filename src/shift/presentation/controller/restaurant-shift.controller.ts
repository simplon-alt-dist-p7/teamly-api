import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { DuplicateWeekCommand } from 'src/shift/applications/use-cases/commands/duplicate-week/duplicate-shift.command';
import { GetShiftsByRestaurantQuery } from 'src/shift/applications/use-cases/queries/get-shifts-by-restaurant-id.query';
import { DuplicateWeekDto } from '../dto/request/duplicate-week.dto';

@Controller('restaurant/:restaurantId/shifts')
export class RestaurantShiftsController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @UseGuards(AuthGuard)
  @Get()
  findByRestaurantId(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.queryBus.execute(
      new GetShiftsByRestaurantQuery({
        restaurantId,
        ownerId: req.user.sub,
      }),
    );
  }

  @HttpCode(204)
  @UseGuards(AuthGuard)
  @Post('duplicate-week')
  duplicateWeek(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: DuplicateWeekDto,
  ) {
    return this.commandBus.execute(
      new DuplicateWeekCommand({
        restaurantId,
        referenceDate: new Date(dto.referenceDate),
        ownerId: req.user.sub,
      }),
    );
  }
}
