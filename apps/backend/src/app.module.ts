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
  ],
})
export class AppModule {}
