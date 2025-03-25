import { Injectable } from '@nestjs/common';

/**
 * Main application service
 */
@Injectable()
export class AppService {
  /**
   * Get application health status
   * @returns Health status message
   */
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
