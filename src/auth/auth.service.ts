import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import { CreateUserRequest } from './dtos/request/create-user-dto';
import { LoginUserRequest } from './dtos/request/login-user-dto';
import { LoginResponse } from './dtos/response/login-response-dto';
import { UserResponse } from './dtos/response/user-response-dto';
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async createUser(createUserDto: CreateUserRequest): Promise<UserResponse> {
    const { password, role, email } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Vérifier les informations');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        role: role,
      },
    });

    return new UserResponse(createdUser);
  }

  async login(loginRequest: LoginUserRequest): Promise<LoginResponse> {
    const { password, email } = loginRequest;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!existingUser) {
      throw new BadRequestException('Vérifier les informations');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const accessToken = this.jwtService.sign({
      sub: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
    });

    return new LoginResponse(accessToken);
  }
}
