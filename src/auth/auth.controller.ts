import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CreateUserRequest } from './dtos/request/create-user-dto';
import { ForgotPasswordRequest } from './dtos/request/forgot-password-dto';
import { LoginUserRequest } from './dtos/request/login-user-dto';
import { ResetPasswordRequest } from './dtos/request/reset-password-dto';
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
    return this.authService.createUser({
      ...createUserRequest,
      role: Role.OWNER,
    });
  }

  @Post('/login')
  async login(@Body() loginRequest: LoginUserRequest): Promise<LoginResponse> {
    return this.authService.login(loginRequest);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/forgot-password')
  forgotPassword(@Body() body: ForgotPasswordRequest) {
    return this.authService.forgotPassword(body.email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/reset-password')
  resetPassword(@Body() body: ResetPasswordRequest) {
    return this.authService.resetPassword(body.token, body.password);
  }
}
