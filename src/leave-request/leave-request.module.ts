import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { EmployeeModule } from 'src/employee/employee.module';
import { RestaurantModule } from 'src/restaurant/restaurant.module';
import { CreateLeaveRequestHandler } from './applications/use-cases/commands/create-leave-request/create-leave-request.handler';
import { GetMyLeaveRequestsHandler } from './applications/use-cases/queries/get-my-leave-requests.handler';
import { GetTeamLeaveRequestsHandler } from './applications/use-cases/queries/get-team-leave-requests.handler';
import { LeaveRequestsPrismaRepository } from './data-access/adapters/leave-requests-prisma.repository';
import { LEAVE_REQUEST_REPOSITORY } from './data-access/leave-requests.repository';
import { LeaveRequestController } from './presentation/controller/leave-request.controller';
import { RestaurantLeaveRequestController } from './presentation/controller/restaurant-leave-request.controller';

@Module({
  imports: [CqrsModule, PrismaModule, EmployeeModule, RestaurantModule],
  providers: [
    {
      provide: LEAVE_REQUEST_REPOSITORY,
      useClass: LeaveRequestsPrismaRepository,
    },
    CreateLeaveRequestHandler,
    GetMyLeaveRequestsHandler,
    GetTeamLeaveRequestsHandler,
  ],
  controllers: [LeaveRequestController, RestaurantLeaveRequestController],
})
export class LeaveRequestModule {}
