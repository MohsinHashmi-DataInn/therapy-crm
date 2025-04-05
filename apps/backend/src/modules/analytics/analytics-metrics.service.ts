import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateMetricDto } from './dto/create-metric.dto';
import { UpdateMetricDto } from './dto/update-metric.dto';

/**
 * Service for managing analytics metrics
 * Handles CRUD operations for clinical and operational KPIs
 */
@Injectable()
export class AnalyticsMetricsService {
  private readonly logger = new Logger(AnalyticsMetricsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new analytics metric
   * @param createMetricDto Data for the new metric
   * @param userId User creating the metric
   * @returns The newly created metric
   */
  async create(createMetricDto: CreateMetricDto, userId: BigInt) {
    try {
      return await this.prisma.analytics_metrics.create({
        data: {
          ...createMetricDto,
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to create metric: ${error.message}`, error.stack);
      if (error.code === 'P2002') {
        throw new ConflictException(`A metric with the name "${createMetricDto.metric_name}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Find all metrics with optional category filtering
   * @param category Optional category to filter by
   * @returns List of metrics matching the criteria
   */
  async findAll(category?: string) {
    try {
      const whereClause = category ? { metric_category: category } : {};
      
      return await this.prisma.analytics_metrics.findMany({
        where: whereClause,
        orderBy: [
          { metric_category: 'asc' },
          { metric_name: 'asc' },
        ],
        include: {
          metrics_snapshots: {
            take: 1,
            orderBy: {
              snapshot_date: 'desc',
            },
          },
        },
      });
    } catch (error: any) {
      this.logger.error(`Failed to find metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a metric by ID
   * @param id The metric ID
   * @returns The found metric
   */
  async findOne(id: BigInt) {
    try {
      const metric = await this.prisma.analytics_metrics.findUnique({
        where: { id },
        include: {
          metrics_snapshots: {
            take: 10,
            orderBy: {
              snapshot_date: 'desc',
            },
          },
          dashboard_widgets: {
            where: {
              is_active: true,
            },
          },
        },
      });

      if (!metric) {
        throw new NotFoundException(`Metric with ID ${id} not found`);
      }

      return metric;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find metric: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Find a metric by name
   * @param metricName The unique metric name
   * @returns The found metric
   */
  async findByName(metricName: string) {
    try {
      const metric = await this.prisma.analytics_metrics.findUnique({
        where: { metric_name: metricName },
        include: {
          metrics_snapshots: {
            take: 10,
            orderBy: {
              snapshot_date: 'desc',
            },
          },
        },
      });

      if (!metric) {
        throw new NotFoundException(`Metric with name ${metricName} not found`);
      }

      return metric;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to find metric by name: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update a metric
   * @param id The metric ID to update
   * @param updateMetricDto The updated metric data
   * @param userId User making the update
   * @returns The updated metric
   */
  async update(id: BigInt, updateMetricDto: UpdateMetricDto, userId: BigInt) {
    try {
      // Check if metric exists
      await this.findOne(id);

      return await this.prisma.analytics_metrics.update({
        where: { id },
        data: {
          ...updateMetricDto,
          updated_by: userId,
          updated_at: new Date(),
        },
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update metric: ${error.message}`, error.stack);
      if (error.code === 'P2002') {
        throw new ConflictException(`A metric with the name "${updateMetricDto.metric_name}" already exists`);
      }
      throw error;
    }
  }

  /**
   * Remove a metric
   * @param id The metric ID to remove
   * @returns The removed metric
   */
  async remove(id: BigInt) {
    try {
      // Check if metric exists
      await this.findOne(id);

      // Check if metric is used in any dashboard widgets
      const widgets = await this.prisma.dashboard_widgets.findMany({
        where: { metric_id: id },
        take: 1,
      });

      if (widgets.length > 0) {
        throw new ConflictException(
          'Cannot delete a metric that is used in dashboard widgets. Remove the widgets first.',
        );
      }

      return await this.prisma.analytics_metrics.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Failed to remove metric: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculate and store a new metric value snapshot
   * @param metricId The metric to calculate
   * @param userId User triggering the calculation
   * @returns The new metrics snapshot
   */
  async calculateMetricValue(metricId: BigInt, userId: BigInt) {
    try {
      // Get the metric to calculate
      const metric = await this.findOne(metricId);
      let metricValue = 0;

      // Example calculation logic based on metric type
      switch (metric.metric_name) {
        case 'therapy_hours_delivered':
          // Example: Sum appointment durations for the last 30 days
          const appointments = await this.prisma.appointments.findMany({
            where: {
              start_time: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
              status: 'COMPLETED',
            },
            select: {
              start_time: true,
              end_time: true,
            },
          });
          
          metricValue = appointments.reduce((total: number, appt: any) => {
            const durationHours = 
              (appt.end_time.getTime() - appt.start_time.getTime()) / (1000 * 60 * 60);
            return total + durationHours;
          }, 0);
          break;

        // Add more metric calculations as needed
        
        default:
          // For metrics without a specific calculation, return 0
          metricValue = 0;
      }

      // Create a new snapshot
      return await this.prisma.metrics_snapshots.create({
        data: {
          metric_id: metricId,
          metric_value: metricValue,
          snapshot_date: new Date(),
          created_by: userId,
          updated_by: userId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to calculate metric value: ${error.message}`, error.stack);
      throw error;
    }
  }
}
