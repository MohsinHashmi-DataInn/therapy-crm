import { Module } from '@nestjs/common';
import { ClientModule } from './modules/client/client.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { LearnerModule } from './modules/learner/learner.module';
import { WaitlistModule } from './modules/waitlist/waitlist.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { ReportModule } from './modules/report/report.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ClientModule,
    LearnerModule,
    AppointmentModule,
    WaitlistModule,
    CommunicationModule,
    ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
