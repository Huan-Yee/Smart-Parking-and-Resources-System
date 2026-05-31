import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * GET /
   * Health-check endpoint. Returns backend service status and current timestamp.
   * Use this to verify the backend is reachable before running integration tests.
   *
   * Example response:
   * {
   *   "service": "MMU Smart Parking Backend",
   *   "status": "running",
   *   "version": "1.0.0",
   *   "timestamp": "2026-05-31T09:00:00.000Z"
   * }
   */
  @Get()
  healthCheck() {
    return this.appService.getHealthCheck();
  }
}
