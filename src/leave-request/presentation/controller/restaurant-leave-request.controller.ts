import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { GetTeamLeaveRequestsQuery } from '../../applications/use-cases/queries/get-team-leave-requests.query';

@Controller('restaurant/:restaurantId/leave-requests')
export class RestaurantLeaveRequestController {
  constructor(private readonly queryBus: QueryBus) {}

  @UseGuards(AuthGuard)
  @Get()
  findByRestaurantId(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.queryBus.execute(
      new GetTeamLeaveRequestsQuery({ restaurantId, ownerId: req.user.sub }),
    );
  }
}
