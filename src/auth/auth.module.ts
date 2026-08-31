import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
// import { PrismaModule } from 'prisma/prisma.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
