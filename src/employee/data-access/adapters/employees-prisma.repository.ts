// data-access/adapters/employees-prisma.repository.ts
import { Injectable } from '@nestjs/common';
import { Employee } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { EmployeesRepository } from '../employees.repository';

@Injectable()
export class EmployeesPrismaRepository implements EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    restaurantId: string;
    firstName: string;
    lastName: string;
  }): Promise<Employee> {
    return this.prisma.employee.create({ data });
  }

  async findByRestaurantId(restaurantId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({ where: { restaurantId } });
  }
}
