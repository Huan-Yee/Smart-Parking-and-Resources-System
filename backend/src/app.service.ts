import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * Returns a simple health-check payload for the root GET / endpoint.
   * Use this to verify the backend is running before testing API routes.
   */
  getHealthCheck() {
    return {
      service: 'MMU Smart Parking Backend',
      status: 'running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
