import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CreateUserRequest } from './dtos/request/create-user-dto';
import { LoginUserRequest } from './dtos/request/login-user-dto';
import { LoginResponse } from './dtos/response/login-response-dto';
import { UserResponse } from './dtos/response/user-response-dto';

import type { AuthenticatedRequest } from './auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Post('/register')
  async registerUser(
    @Body() createUserRequest: CreateUserRequest,
  ): Promise<UserResponse> {
    return this.authService.createUser(createUserRequest);
  }

  @Post('/login')
  async login(@Body() loginRequest: LoginUserRequest): Promise<LoginResponse> {
    return this.authService.login(loginRequest);
  }
}
