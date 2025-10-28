import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DigestsService } from '../src/digests/digests.service';

describe('Digests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const digestsStub: Partial<DigestsService> = {
      composeAndSummarize: async (spaceId: string) => ({ id: `d_${spaceId}`, summary: 'stub summary' }),
    } as any;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DigestsService)
      .useValue(digestsStub)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /digests returns a summary', async () => {
    const res = await request(app.getHttpServer())
      .post('/digests')
      .send({ spaceId: '1' })
      .expect(201);

    expect(res.body.ok).toBe(true);
    expect(res.body.data.summary).toBe('stub summary');
    expect(res.body.data.id).toBe('d_1');
  });
});
