import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { AuthenticatedRequest } from 'src/auth/auth.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateEmployeeRequest } from './dtos/request/create-employee-dto';
import { EmployeeService } from './employee.service';
@Controller('restaurant/:restaurantId/employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() dto: CreateEmployeeRequest,
    @Req() req: AuthenticatedRequest,
    @Param('restaurantId') restaurantId: string,
  ) {
    // req.user.sub = id du OWNER
    return this.employeeService.createEmployee(restaurantId, dto, req.user.sub);
  }
}
