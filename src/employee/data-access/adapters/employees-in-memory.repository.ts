// data-access/adapters/employees-in-memory.repository.ts
import { Injectable } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  CreateEmployeeData,
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

  async findByRestaurantId(restaurantId: string): Promise<Employee[]> {
    return this.employees.filter((e) => e.restaurantId === restaurantId);
  }

  async findById(employeeId: string): Promise<Employee | null> {
    return this.employees.find((e) => e.id === employeeId) ?? null;
  }
}
