import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS so the Frontend (Port 3000) can talk to this Backend
  app.enableCors();

  // Global Validation Pipe (The Category Checker Gate)
  // - whitelist: strips any unknown properties not in the DTO
  // - transform: auto-converts payload types to match DTO definitions
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Listen on Port 5001 (Port 5000 conflicts with macOS machine)
  await app.listen(process.env.PORT ?? 5001);
}
bootstrap();