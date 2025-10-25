import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  // CORS: allow localhost for dev and *.squadspace.me for prod
  const isAllowedOrigin = (origin?: string) => {
    if (!origin) return true; // SSR or same-origin
    try {
      const url = new URL(origin);
      const host = url.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1') return true;
      if (host.endsWith('.localhost')) return true; // e.g., demo.localhost
      if (host === 'squadspace.me' || host.endsWith('.squadspace.me')) return true;
      return false;
    } catch {
      return false;
    }
  };
  app.enableCors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin || undefined)),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  await app.listen(4000, '0.0.0.0');
}
bootstrap();
