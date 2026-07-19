import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserRequest } from './dtos/request/create-user-dto';
import { LoginUserRequest } from './dtos/request/login-user-dto';
import { LoginResponse } from './dtos/response/login-response-dto';
import { UserResponse } from './dtos/response/user-response-dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
