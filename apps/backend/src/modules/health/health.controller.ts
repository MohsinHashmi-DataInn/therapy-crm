import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controller for health check endpoints
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Basic health check endpoint
   * @returns Health status of the API
   */
  @Get()
  @ApiOperation({ summary: 'Check API health status' })
  @ApiResponse({ status: 200, description: 'API is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'API is up and running',
    };
  }
}
