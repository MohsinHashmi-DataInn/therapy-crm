import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationPreferencesController } from './notification-preferences.controller';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationTemplatesController } from './notification-templates.controller';
import { NotificationLogsService } from './notification-logs.service';
import { NotificationLogsController } from './notification-logs.controller';
import { NotificationSenderService } from './notification-sender.service';

/**
 * Module for enhanced notification management
 * Provides CASL-compliant preferences, customizable templates,
 * notification delivery, and audit logging
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    NotificationPreferencesController,
    NotificationTemplatesController,
    NotificationLogsController,
  ],
  providers: [
    NotificationPreferencesService,
    NotificationTemplatesService,
    NotificationLogsService,
    NotificationSenderService,
  ],
  exports: [
    NotificationPreferencesService,
    NotificationTemplatesService,
    NotificationLogsService,
    NotificationSenderService,
  ],
})
export class NotificationsModule {}
