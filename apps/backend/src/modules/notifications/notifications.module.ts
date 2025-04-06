import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationSenderService } from './notification-sender.service';

/**
 * Module for enhanced notification management
 * Provides CASL-compliant preferences, customizable templates,
 * notification delivery, and audit logging
 */
@Module({
  imports: [PrismaModule],
  controllers: [
  ],
  providers: [
    NotificationSenderService,
  ],
  exports: [
    NotificationSenderService,
  ],
})
export class NotificationsModule {}
