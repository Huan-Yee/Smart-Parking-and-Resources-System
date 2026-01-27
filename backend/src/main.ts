import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS so the Frontend (Port 3000) can talk to this Backend
  app.enableCors();
  // Listen on Port 5000 (instead of 3000) to avoid conflict with Next.js
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();