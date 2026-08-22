import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { EmployeeModule } from 'src/employee/employee.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { CreateShiftHandler } from './applications/use-cases/commands/create-shift/create-shift.handler';
import { GetShiftsByRestaurantHandler } from './applications/use-cases/queries/get-shifts-by-restaurant-id.handler';
import { ShiftsPrismaRepository } from './data-access/adapters/shifts-prisma.repository';
import { SHIFT_REPOSITORY } from './data-access/shifts.repository';
import { RestaurantShiftsController } from './presentation/controller/restaurant-shift.controller';
import { ShiftController } from './presentation/controller/shift.controller';
import { ShiftService } from './shift.service';

@Module({
  imports: [CqrsModule, PrismaModule, EmployeeModule, RestaurantModule],
  providers: [
    ShiftService,
    { provide: SHIFT_REPOSITORY, useClass: ShiftsPrismaRepository },
    CreateShiftHandler,
    GetShiftsByRestaurantHandler,
  ],
  controllers: [ShiftController, RestaurantShiftsController],
})
export class ShiftModule {}
