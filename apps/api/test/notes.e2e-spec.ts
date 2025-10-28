import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

// Minimal in-memory stubs for Space and Note models used by SpacesService

describe('Notes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const spaces = new Map<string, any>();
    const notes = new Map<string, any>();

    // Seed a demo space
    const demoSpace = { id: 's_demo', name: 'Demo Space', slug: 'demo', plan: 'free' };
    spaces.set(demoSpace.slug, demoSpace);

    const prismaStub: Partial<PrismaService> = {
      $connect: async () => {},
      $disconnect: async () => {},
      space: {
        findUnique: async ({ where: { slug } }: any) => spaces.get(slug) ?? null,
      },
      note: {
        findMany: async ({ where: { spaceId } }: any) =>
          Array.from(notes.values()).filter((n) => n.spaceId === spaceId),
        create: async ({ data }: any) => {
          const id = `n_${Math.random().toString(36).slice(2)}`;
          const rec = { id, ...data };
          notes.set(id, rec);
          return rec;
        },
        findUnique: async ({ where: { id } }: any) => notes.get(id) ?? null,
        update: async ({ where: { id }, data }: any) => {
          const existing = notes.get(id);
          if (!existing) return null;
          const updated = { ...existing, ...data };
          notes.set(id, updated);
          return updated;
        },
        delete: async ({ where: { id } }: any) => {
          const existing = notes.get(id);
          if (!existing) return null;
          notes.delete(id);
          return existing;
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

  it('GET /spaces/:slug/notes returns [] initially', async () => {
    const res = await request(app.getHttpServer()).get('/spaces/demo/notes').expect(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('POST /spaces/:slug/notes creates a note', async () => {
    const res = await request(app.getHttpServer())
      .post('/spaces/demo/notes')
      .send({ title: 'First Note' })
      .expect(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.title).toBe('First Note');
    expect(res.body.data.ydocId).toBeTruthy();
  });

  it('PATCH /spaces/:slug/notes/:id updates title', async () => {
    const created = await request(app.getHttpServer())
      .post('/spaces/demo/notes')
      .send({ title: 'Temp' })
      .expect(201);
    const id = created.body.data.id as string;

    const updated = await request(app.getHttpServer())
      .patch(`/spaces/demo/notes/${id}`)
      .send({ title: 'Renamed' })
      .expect(200);

    expect(updated.body.ok).toBe(true);
    expect(updated.body.data.title).toBe('Renamed');
  });

  it('DELETE /spaces/:slug/notes/:id removes note', async () => {
    const created = await request(app.getHttpServer())
      .post('/spaces/demo/notes')
      .send({ title: 'To Delete' })
      .expect(201);
    const id = created.body.data.id as string;

    const del = await request(app.getHttpServer())
      .delete(`/spaces/demo/notes/${id}`)
      .expect(200);

    expect(del.body.ok).toBe(true);
    expect(del.body.data.id).toBe(id);
  });
});
