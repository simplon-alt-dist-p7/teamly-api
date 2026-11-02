import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from 'prisma/prisma.module';
import { EmployeeModule } from 'src/employee/employee.module';
import { CreateLeaveRequestHandler } from './applications/use-cases/commands/create-leave-request/create-leave-request.handler';
import { LeaveRequestsPrismaRepository } from './data-access/adapters/leave-requests-prisma.repository';
import { LEAVE_REQUEST_REPOSITORY } from './data-access/leave-requests.repository';
import { LeaveRequestController } from './presentation/controller/leave-request.controller';

@Module({
  imports: [CqrsModule, PrismaModule, EmployeeModule],
  providers: [
    {
      provide: LEAVE_REQUEST_REPOSITORY,
      useClass: LeaveRequestsPrismaRepository,
    },
    CreateLeaveRequestHandler,
  ],
  controllers: [LeaveRequestController],
})
export class LeaveRequestModule {}
