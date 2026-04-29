import 'dotenv/config';
import 'reflect-metadata';
import path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

try {
  (process as NodeJS.Process & { loadEnvFile?: (p: string) => void }).loadEnvFile?.(
    path.resolve(__dirname, '../../../.env')
  );
} catch {}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
}

bootstrap();
