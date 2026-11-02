import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  LeaveRequest,
  LeaveStatus,
} from '../../domain/models/leave-request.entity';
import { LeaveRequestRepository } from '../leave-requests.repository';

@Injectable()
export class LeaveRequestsPrismaRepository implements LeaveRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    const saved = await this.prisma.leaveRequest.create({
      data: {
        id: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        status: leaveRequest.status,
        createdAt: leaveRequest.createdAt,
      },
    });

    return this.toDomain(saved);
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    const rows = await this.prisma.leaveRequest.findMany({
      where: { employeeId },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: {
    id: string;
    employeeId: string;
    startDate: Date;
    endDate: Date;
    status: LeaveStatus;
    createdAt: Date;
  }): LeaveRequest {
    return new LeaveRequest({
      id: row.id,
      employeeId: row.employeeId,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      createdAt: row.createdAt,
    });
  }
}
