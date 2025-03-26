import { Module } from '@nestjs/common';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * Module for handling appointment management
 */
@Module({
  imports: [PrismaModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService],
})
export class AppointmentModule {}
