import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { SpacesService } from '../src/spaces/spaces.service';

describe('Tasks (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // In-memory stub for PrismaService.task used by TasksService
    const store = new Map<string, any>();
    const prismaStub: Partial<PrismaService> = {
      $connect: async () => {},
      $disconnect: async () => {},
      task: {
        findMany: async ({ where: { spaceId } }: any) =>
          Array.from(store.values()).filter((t) => t.spaceId === spaceId),
        create: async ({ data }: any) => {
          const id = `t_${Math.random().toString(36).slice(2)}`;
          const rec = { id, ...data };
          store.set(id, rec);
          return rec;
        },
        findUnique: async ({ where: { id } }: any) => store.get(id) ?? null,
        update: async ({ where: { id }, data }: any) => {
          const existing = store.get(id);
          if (!existing) return null;
          const updated = { ...existing, ...data };
          store.set(id, updated);
          return updated;
        },
      },
    } as any;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaStub)
      .overrideProvider(SpacesService)
      .useValue({ findAll: () => [] })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tasks creates a task', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'e2e task', spaceId: 'space-1' })
      .expect(201);

    expect(res.body.ok).toBe(true);
    expect(res.body.data.title).toBe('e2e task');
    expect(res.body.data.status).toBe('todo');
  });

  it('PATCH /tasks/:id updates status', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .send({ title: 'move me', spaceId: 'space-2' })
      .expect(201);

    const id = created.body.data.id as string;

    const updated = await request(app.getHttpServer())
      .patch(`/tasks/${id}`)
      .send({ status: 'in_progress' })
      .expect(200);

    expect(updated.body.ok).toBe(true);
    expect(updated.body.data.status).toBe('in_progress');
  });
});