import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientModule } from './modules/client/client.module';
import { LearnerModule } from './modules/learner/learner.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { HealthModule } from './modules/health/health.module';
import { PracticeModule } from './modules/practice.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { BillingModule } from './modules/billing/billing.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentStorageModule } from './modules/document-storage/document-storage.module';
import { TelehealthModule } from './modules/telehealth/telehealth.module';
import { EmailModule } from './common/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    ClientModule,
    LearnerModule,
    AppointmentModule,
    CommunicationModule,
    WaitlistModule,
    HealthModule,
    PracticeModule,
    AnalyticsModule,
    BillingModule,
    NotificationsModule,
    DocumentStorageModule,
    TelehealthModule,
    EmailModule,
  ],
})
export class AppModule {}
