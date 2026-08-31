import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/auth/auth.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateRestaurantRequest } from './dtos/request/create-restaurant-dto';
import { RestaurantService } from './restaurant.service';
@Controller('restaurant')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() dto: CreateRestaurantRequest,
    @Req() req: AuthenticatedRequest,
  ) {
    // req.user.sub = id du OWNER
    return this.restaurantService.createRestaurant(dto, req.user.sub);
  }

  @UseGuards(AuthGuard)
  @Get()
  findByOwnerId(@Req() req: AuthenticatedRequest) {
    // req.user.sub = id du OWNER
    return this.restaurantService.findByOwnerId(req.user.sub);
  }
}
