import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * Main application controller
 */
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Get application health status
   * @returns Health status message
   */
  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
