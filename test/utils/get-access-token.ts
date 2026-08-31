import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

type LoginResponseBody = { accessToken: string };

export async function getAccessToken(
  email: string,
  password: string,
  app: INestApplication<App>,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);

  return (response.body as LoginResponseBody).accessToken;
}
