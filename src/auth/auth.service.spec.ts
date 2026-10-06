import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { resetTokenSecret } from './constants';
import {
  AuthService,
  FORGOT_PASSWORD_MESSAGE,
  RESET_PASSWORD_MESSAGE,
} from './auth.service';

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

describe('resetPassword', () => {
  let service: AuthService;
  const findUnique = jest.fn();
  const update = jest.fn();
  const decode = jest.fn();
  const verifyAsync = jest.fn();

  beforeEach(async () => {
    findUnique.mockReset();
    update.mockReset();
    decode.mockReset();
    verifyAsync.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: { user: { findUnique, update } },
        },
        { provide: JwtService, useValue: { decode, verifyAsync } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('rejects a token that does not contain a user id', async () => {
    decode.mockReturnValue(null);

    await expect(
      service.resetPassword('token', 'nouveauMotDePasse'),
    ).rejects.toThrow(BadRequestException);
    expect(update).not.toHaveBeenCalled();
  });

  it('rejects the link when the signature does not match', async () => {
    decode.mockReturnValue({ sub: '42' });
    findUnique.mockResolvedValue({ id: '42', password: 'hash' });
    verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(
      service.resetPassword('token', 'nouveauMotDePasse'),
    ).rejects.toThrow("Ce lien n'est plus valide");
    expect(verifyAsync).toHaveBeenCalledWith('token', {
      secret: resetTokenSecret('hash'),
    });
    expect(update).not.toHaveBeenCalled();
  });

  it('saves the new password when the link is valid', async () => {
    decode.mockReturnValue({ sub: '42' });
    findUnique.mockResolvedValue({ id: '42', password: 'hash' });
    verifyAsync.mockResolvedValue({ sub: '42' });
    update.mockResolvedValue({});

    await expect(
      service.resetPassword('token', 'nouveauMotDePasse'),
    ).resolves.toEqual({
      message: RESET_PASSWORD_MESSAGE,
    });

    const savedPassword = update.mock.calls[0][0].data.password;
    expect(savedPassword).not.toBe('nouveauMotDePasse');
    expect(savedPassword.startsWith('$2')).toBe(true);
  });
});
