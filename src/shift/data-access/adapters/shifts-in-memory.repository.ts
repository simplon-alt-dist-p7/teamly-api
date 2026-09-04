import { Injectable } from '@nestjs/common';
import { Shift } from '../../domain/models/shift.entity';
import { ShiftRepository } from '../shifts.repository';

@Injectable()
export class ShiftsInMemoryRepository implements ShiftRepository {
  shifts: Shift[] = [];

  async save(shift: Shift): Promise<Shift> {
    this.shifts.push(shift);
    return shift;
  }

  async findByEmployeeId(employeeId: string): Promise<Shift[]> {
    return this.shifts.filter((s) => s.employeeId === employeeId);
  }

  async findByRestaurantId(_restaurantId: string): Promise<Shift[]> {
    return this.shifts;
  }

  async findById(id: string): Promise<Shift | null> {
    return this.shifts.find((shift) => shift.id === id) ?? null;
  }
  async update(shift: Shift): Promise<Shift> {
    const index = this.shifts.findIndex((s) => s.id === shift.id);
    if (index === -1) {
      throw new Error(`Shift ${shift.id} not found`);
    }
    this.shifts[index] = shift;
    return shift;
  }
}
