// data-access/adapters/employees-in-memory.repository.ts
import { Injectable } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CreateEmployeeData,
  EmployeeListRecord,
  EmployeesRepository,
} from '../employees.repository';

@Injectable()
export class EmployeesInMemoryRepository implements EmployeesRepository {
  employees: Employee[] = [];

  async create(data: CreateEmployeeData): Promise<Employee> {
    const employee = { id: randomUUID(), ...data } as Employee;
    this.employees.push(employee);
    return employee;
  }
  async findByRestaurantId(
    restaurantId: string,
  ): Promise<EmployeeListRecord[]> {
    return this.employees
      .filter((employee) => employee.restaurantId === restaurantId)
      .map((employee) => ({
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        restaurantId: employee.restaurantId,
        email: `${employee.firstName.toLowerCase()}@test.com`,
      }));
  }

  async findById(employeeId: string): Promise<Employee | null> {
    return this.employees.find((e) => e.id === employeeId) ?? null;
  }
}
