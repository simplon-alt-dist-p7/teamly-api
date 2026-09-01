import { EmployeeListRecord } from 'src/employee/data-access/employees.repository';
import { ListEmployeesItemResponse } from './list-employees-item-response';

export class EmployeesListResponse {
  readonly employees: ListEmployeesItemResponse[];

  constructor(result: EmployeeListRecord[]) {
    this.employees = result.map(
      (employee) => new ListEmployeesItemResponse(employee),
    );
  }
}
