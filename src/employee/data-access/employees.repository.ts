import { Employee } from '@prisma/client';

export const EMPLOYEES_REPOSITORY = Symbol('EMPLOYEES_REPOSITORY');

export interface CreateEmployeeData {
  userId: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
}

export interface EmployeesRepository {
  create(data: {
    userId: string;
    restaurantId: string;
    firstName: string;
    lastName: string;
  }): Promise<Employee>;
  findByRestaurantId(restaurantId: string): Promise<Employee[]>;
}
