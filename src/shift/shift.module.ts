import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { EmployeeModule } from 'src/employee/employee.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { CreateShiftHandler } from './applications/use-cases/commands/create-shift/create-shift.handler';
import { DeleteShiftHandler } from './applications/use-cases/commands/delete-shift/delete-shift.handler';
import { DuplicateWeekHandler } from './applications/use-cases/commands/duplicate-week/duplicate-shift.handler';
import { UpdateShiftHandler } from './applications/use-cases/commands/update-shift/update-shift.handler';
import { GetMyShiftsHandler } from './applications/use-cases/queries/get-my-shifts.handler';
import { GetShiftsByRestaurantHandler } from './applications/use-cases/queries/get-shifts-by-restaurant-id.handler';
import { ShiftsPrismaRepository } from './data-access/adapters/shifts-prisma.repository';
import { SHIFT_REPOSITORY } from './data-access/shifts.repository';
import { MyShiftsController } from './presentation/controller/my-shifts.controller';
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
    GetMyShiftsHandler,
    DuplicateWeekHandler,
    UpdateShiftHandler,
    DeleteShiftHandler,
  ],
  controllers: [
    ShiftController,
    RestaurantShiftsController,
    MyShiftsController,
  ],
})
export class ShiftModule {}
