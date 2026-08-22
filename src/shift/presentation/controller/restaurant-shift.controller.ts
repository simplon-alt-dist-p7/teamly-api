import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { GetShiftsByRestaurantQuery } from 'src/shift/applications/use-cases/queries/get-shifts-by-restaurant-id.query';

@Controller('restaurant/:restaurantId/shifts')
export class RestaurantShiftsController {
  constructor(private readonly queryBus: QueryBus) {}

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
}
