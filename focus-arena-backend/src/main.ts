import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
// import rateLimit from 'express-rate-limit'; // 1. Comment this out

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Validation
  app.useGlobalPipes(new ValidationPipe());

  // ✅ CORS (Must be before helmet)
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // ✅ Security
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  // ❌ REMOVED RATE LIMITER TO FIX 429 ERROR
  /*
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 100,
    }),
  );
  */

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}

void bootstrap();