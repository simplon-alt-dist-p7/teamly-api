import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard, type AuthenticatedRequest } from 'src/auth/auth.guard';
import { CreateSupplierCommand } from 'src/stock/applications/use-cases/commands/create-supplier/create-supplier.command';
import { GetSuppliersQuery } from 'src/stock/applications/use-cases/queries/get-suppliers/get-suppliers.query';
import { CreateSupplierDto } from '../dto/request/create-supplier.dto';

@Controller('restaurant/:restaurantId/suppliers')
export class SupplierController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateSupplierDto,
  ) {
    return this.commandBus.execute(
      new CreateSupplierCommand({
        restaurantId,
        ownerId: req.user.sub,
        name: dto.name,
        phone: dto.phone,
      }),
    );
  }

  @UseGuards(AuthGuard)
  @Get()
  findByRestaurantId(
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.queryBus.execute(
      new GetSuppliersQuery({
        restaurantId,
        ownerId: req.user.sub,
      }),
    );
  }
}
