import { Module } from '@nestjs/common';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * Module for handling communication management
 */
@Module({
  imports: [PrismaModule],
  controllers: [CommunicationController],
  providers: [CommunicationService],
  exports: [CommunicationService],
})
export class CommunicationModule {}
