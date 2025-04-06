import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AnalyticsMetricsService } from './analytics-metrics.service';
import { AnalyticsMetricsController } from './analytics-metrics.controller';
// These services need to be implemented later if required
// For now, removing missing imports to fix TypeScript errors

/**
 * Module for analytics and metrics tracking functionality
 * Provides services for tracking clinical and operational KPIs,
 * customizable dashboards, and historical metrics data
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    AnalyticsMetricsController,
    // DashboardWidgetsController, // Commented out until implemented
  ],
  providers: [
    AnalyticsMetricsService,
    // DashboardWidgetsService, // Commented out until implemented
    // MetricsSnapshotsService, // Commented out until implemented
  ],
  exports: [
    AnalyticsMetricsService,
    // DashboardWidgetsService, // Commented out until implemented
    // MetricsSnapshotsService, // Commented out until implemented
  ],
})
export class AnalyticsModule {}
