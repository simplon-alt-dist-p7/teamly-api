import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { resetTokenSecret } from './constants';
import { AuthService, FORGOT_PASSWORD_MESSAGE } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: {} },
        { provide: JwtService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

describe('forgotPassword', () => {
  let service: AuthService;
  const findUnique = jest.fn();
  const sign = jest.fn();

  beforeEach(async () => {
    findUnique.mockReset();
    sign.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: { user: { findUnique } } },
        { provide: JwtService, useValue: { sign } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns the same message when the email is unknown', async () => {
    findUnique.mockResolvedValue(null);

    await expect(service.forgotPassword('inconnu@test.fr')).resolves.toEqual({
      message: FORGOT_PASSWORD_MESSAGE,
    });
    expect(sign).not.toHaveBeenCalled();
  });

  it('signs a one-hour link with the stored password when the email exists', async () => {
    findUnique.mockResolvedValue({ id: '42', password: 'hash' });
    sign.mockReturnValue('token');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    await expect(service.forgotPassword('marie@test.fr')).resolves.toEqual({
      message: FORGOT_PASSWORD_MESSAGE,
    });

    expect(sign).toHaveBeenCalledWith(
      { sub: '42' },
      { secret: resetTokenSecret('hash'), expiresIn: '1h' },
    );
    expect(console.log).toHaveBeenCalledWith(
      'Lien de réinitialisation : http://localhost:3001/reset-password?token=token',
    );
  });
});
