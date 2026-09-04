import { Shift } from '../domain/models/shift.entity';

export interface ShiftRepository {
  save(shift: Shift): Promise<Shift>;
  update(shift: Shift): Promise<Shift>;
  findById(id: string): Promise<Shift | null>;
  findByEmployeeId(employeeId: string): Promise<Shift[]>;
  findByRestaurantId(restaurantId: string): Promise<Shift[]>;
}

export const SHIFT_REPOSITORY = Symbol('SHIFT_REPOSITORY');
