import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Minimal in-memory stub for user create/find
    const users: any[] = [];
    const prismaStub: Partial<PrismaService> = {
      $connect: async () => {},
      $disconnect: async () => {},
      user: {
        findUnique: async ({ where: { email } }: any) => users.find((u) => u.email === email) ?? null,
        create: async ({ data, select }: any) => {
          const rec = { id: `u_${Math.random().toString(36).slice(2)}`, ...data };
          users.push(rec);
          if (select) {
            const out: any = {};
            for (const k of Object.keys(select)) if (select[k]) out[k] = rec[k];
            return out;
          }
          return rec;
        },
      },
    } as any;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/signup creates a user profile', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'new@example.com', name: 'New User', password: 'password123' })
      .expect(201);

    expect(res.body.ok).toBe(true);
    expect(res.body.data.email).toBe('new@example.com');
    expect(res.body.data.name).toBe('New User');
    expect(res.body.data).toHaveProperty('id');
  });

  it('POST /auth/signup rejects duplicate emails', async () => {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'dupe@example.com', password: 'password123' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'dupe@example.com', password: 'password123' })
      .expect(201);

    expect(res.body.ok).toBe(false);
  });
});
