import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Shift } from '../../domain/models/shift.entity';
import { TimeRange } from '../../domain/value-objects/timeRange';
import { ShiftRepository } from '../shifts.repository';

@Injectable()
export class ShiftsPrismaRepository implements ShiftRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Shift | null> {
    const row = await this.prisma.shift.findUnique({
      where: { id },
    });
    if (!row) {
      return null;
    }
    return this.toDomain(row);
  }
  async update(shift: Shift): Promise<Shift> {
    const updated = await this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        startTime: shift.startTime,
        endTime: shift.endTime,
      },
    });
    return this.toDomain(updated);
  }

  async save(shift: Shift): Promise<Shift> {
    const saved = await this.prisma.shift.create({
      data: {
        id: shift.id,
        employeeId: shift.employeeId,
        startTime: shift.startTime,
        endTime: shift.endTime,
      },
    });

    return this.toDomain(saved);
  }

  async findByEmployeeId(employeeId: string): Promise<Shift[]> {
    const rows = await this.prisma.shift.findMany({
      where: { employeeId },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findByRestaurantId(restaurantId: string): Promise<Shift[]> {
    const rows = await this.prisma.shift.findMany({
      where: {
        employee: {
          restaurantId: restaurantId,
        },
      },
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: {
    id: string;
    employeeId: string;
    startTime: Date;
    endTime: Date;
  }): Shift {
    return new Shift({
      id: row.id,
      employeeId: row.employeeId,
      timeRange: new TimeRange({
        startTime: row.startTime,
        endTime: row.endTime,
      }),
    });
  }
}
