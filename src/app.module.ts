import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { ShiftModule } from './shift/shift.module';
import { TaskModule } from './task/task.module';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    RestaurantModule,
    EmployeeModule,
    ShiftModule,
    TaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
