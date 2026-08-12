import { Module } from '@nestjs/common';
import { PrismaModule } from 'prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { EmployeesPrismaRepository } from './data-access/adapters/employees-prisma.repository';
import { EMPLOYEES_REPOSITORY } from './data-access/employees.repository';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

@Module({
  imports: [PrismaModule, AuthModule, RestaurantModule],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    { provide: EMPLOYEES_REPOSITORY, useClass: EmployeesPrismaRepository },
  ],
  exports: [EMPLOYEES_REPOSITORY],
})
export class EmployeeModule {}
