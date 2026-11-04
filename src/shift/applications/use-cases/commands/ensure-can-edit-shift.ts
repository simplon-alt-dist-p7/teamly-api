import { ForbiddenException } from '@nestjs/common';
import type { Employee, Restaurant } from '@prisma/client';
import type { EmployeesRepository } from 'src/employee/data-access/employees.repository';
import { isPartnerPlanning } from 'src/shift/partner-planning';

// TEMPORARY (v1): see docs/specs/planning-associes.md. In v2, partners get their own module
// and this check goes back to `restaurant.ownerId === userId`.
// The owner can edit every shift of the restaurant.
// In the partner planning, each partner can also edit his own shifts.
export async function ensureCanEditShift(
  restaurant: Pick<Restaurant, 'id' | 'ownerId'>,
  shiftEmployee: Pick<Employee, 'id'>,
  userId: string,
  employeesRepository: EmployeesRepository,
): Promise<void> {
  if (restaurant.ownerId === userId) {
    return;
  }

  if (isPartnerPlanning(restaurant.id)) {
    const me = await employeesRepository.findByUserId(userId);
    if (me?.id === shiftEmployee.id) {
      return;
    }
  }

  throw new ForbiddenException('You are not the owner of this restaurant');
}
