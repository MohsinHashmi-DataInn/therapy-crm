import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AnalyticsMetricsService } from './analytics-metrics.service';
import { AnalyticsMetricsController } from './analytics-metrics.controller';
import { DashboardWidgetsService } from './dashboard-widgets.service';
import { DashboardWidgetsController } from './dashboard-widgets.controller';
import { MetricsSnapshotsService } from './metrics-snapshots.service';

/**
 * Module for analytics and metrics tracking functionality
 * Provides services for tracking clinical and operational KPIs,
 * customizable dashboards, and historical metrics data
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    AnalyticsMetricsController,
    DashboardWidgetsController,
  ],
  providers: [
    AnalyticsMetricsService,
    DashboardWidgetsService,
    MetricsSnapshotsService,
  ],
  exports: [
    AnalyticsMetricsService,
    DashboardWidgetsService,
    MetricsSnapshotsService,
  ],
})
export class AnalyticsModule {}
