import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'prisma/prisma.service';
import { AppModule } from 'src/app.module';
describe('ShiftController E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();

    prisma = module.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.shift.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.restaurant.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it.skip('POST /employees/:employeeId/shifts creates a shift', async () => {
    // TODO: créer owner + login → token, restaurant + employee
    // await request(app.getHttpServer())
    //   .post(`/employees/${employeeId}/shifts`)
    //   .set('Authorization', `Bearer ${token}`)
    //   .send({ startTime: '...', endTime: '...' })
    //   .expect(201);
  });
});
