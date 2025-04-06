import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TelehealthController } from './telehealth.controller';
import { TelehealthService } from './telehealth.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { TelehealthProvidersController } from './telehealth-providers.controller';
import { TelehealthProvidersService } from './telehealth-providers.service';
import { VirtualSessionsController } from './virtual-sessions.controller';
import { VirtualSessionsService } from './virtual-sessions.service';
import { TelehealthAnalyticsService } from './services/telehealth-analytics.service';
import { TelehealthAnalyticsController } from './controllers/telehealth-analytics.controller';
import { ReportGeneratorService } from './utils/report-generator.service';
import { TelehealthReportsController } from './controllers/telehealth-reports.controller';
import { APP_FILTER } from '@nestjs/core';
import { HttpExceptionFilter } from '../../common/exceptions/http-exception.filter';

/**
 * Module for telehealth virtual session functionality
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [
    TelehealthController,
    TelehealthProvidersController,
    VirtualSessionsController,
    TelehealthAnalyticsController,
    TelehealthReportsController,
  ],
  providers: [
    TelehealthService,
    TelehealthProvidersService,
    VirtualSessionsService,
    TelehealthAnalyticsService,
    ReportGeneratorService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    }
  ],
  exports: [TelehealthService],
})
export class TelehealthModule {}
