import { EmployeeListRecord } from 'src/employee/data-access/employees.repository';

export class ListEmployeesItemResponse {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly restaurantId: string;
  readonly email: string;

  constructor(record: EmployeeListRecord) {
    this.id = record.id;
    this.firstName = record.firstName;
    this.lastName = record.lastName;
    this.restaurantId = record.restaurantId;
    this.email = record.email;
  }
}
