import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import {
  LeaveRequest,
  LeaveStatus,
} from '../../domain/models/leave-request.entity';
import {
  LeaveRequestRepository,
  TeamLeaveRequest,
} from '../leave-requests.repository';

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
        managerNote: leaveRequest.managerNote,
      },
    });

    return this.toDomain(saved);
  }

  async update(leaveRequest: LeaveRequest): Promise<LeaveRequest> {
    const updated = await this.prisma.leaveRequest.update({
      where: { id: leaveRequest.id },
      data: {
        status: leaveRequest.status,
        managerNote: leaveRequest.managerNote,
      },
    });

    return this.toDomain(updated);
  }

  async findById(id: string): Promise<LeaveRequest | null> {
    const row = await this.prisma.leaveRequest.findUnique({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toDomain(row);
  }

  async findByEmployeeId(employeeId: string): Promise<LeaveRequest[]> {
    const rows = await this.prisma.leaveRequest.findMany({
      where: { employeeId },
      orderBy: { startDate: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByRestaurantId(restaurantId: string): Promise<TeamLeaveRequest[]> {
    const rows = await this.prisma.leaveRequest.findMany({
      where: { employee: { restaurantId } },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return rows.map((row) => ({
      leaveRequest: this.toDomain(row),
      firstName: row.employee.firstName,
      lastName: row.employee.lastName,
    }));
  }

  private toDomain(row: {
    id: string;
    employeeId: string;
    startDate: Date;
    endDate: Date;
    status: LeaveStatus;
    createdAt: Date;
    managerNote: string | null;
  }): LeaveRequest {
    return new LeaveRequest({
      id: row.id,
      employeeId: row.employeeId,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      createdAt: row.createdAt,
      managerNote: row.managerNote,
    });
  }
}
