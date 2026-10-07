import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';
import type { EmailSender } from '../email/email-sender';
import { EMAIL_SENDER } from '../email/email-sender';
import { resetTokenSecret } from './constants';
import { CreateUserRequest } from './dtos/request/create-user-dto';
import { LoginUserRequest } from './dtos/request/login-user-dto';
import { LoginResponse } from './dtos/response/login-response-dto';
import { UserResponse } from './dtos/response/user-response-dto';
import { resetPasswordEmail } from './emails/reset-password.email';

export const FORGOT_PASSWORD_MESSAGE =
  'Si un compte existe, un email a été envoyé';

export const RESET_PASSWORD_MESSAGE = 'Mot de passe mis à jour';

const INVALID_RESET_LINK = "Ce lien n'est plus valide";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(EMAIL_SENDER)
    private readonly emailSender: EmailSender,
  ) {}

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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const token = this.jwtService.sign(
        { sub: user.id },
        { secret: resetTokenSecret(user.password), expiresIn: '1h' },
      );
      const frontUrl = process.env.FRONT_URL ?? 'http://localhost:3001';
      const resetLink = `${frontUrl}/reset-password?token=${token}`;

      try {
        await this.emailSender.send(resetPasswordEmail(user.email, resetLink));
      } catch (error) {
        console.error(
          "Échec de l'envoi de l'email de réinitialisation :",
          error instanceof Error ? error.message : error,
        );
      }
    }

    return { message: FORGOT_PASSWORD_MESSAGE };
  }

  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ message: string }> {
    const payload = this.jwtService.decode(token);

    if (
      !payload ||
      typeof payload === 'string' ||
      typeof payload.sub !== 'string'
    ) {
      throw new BadRequestException(INVALID_RESET_LINK);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException(INVALID_RESET_LINK);
    }

    try {
      await this.jwtService.verifyAsync(token, {
        secret: resetTokenSecret(user.password),
      });
    } catch {
      throw new BadRequestException(INVALID_RESET_LINK);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: RESET_PASSWORD_MESSAGE };
  }
}
