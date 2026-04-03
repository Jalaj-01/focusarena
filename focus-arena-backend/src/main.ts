import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Validation
  app.useGlobalPipes(new ValidationPipe());

  // ✅ Security
  app.use(helmet());

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
    }),
  );

  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();