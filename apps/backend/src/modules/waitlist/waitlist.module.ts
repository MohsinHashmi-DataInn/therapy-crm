import { Module } from '@nestjs/common';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * Module for handling waitlist management
 */
@Module({
  imports: [PrismaModule],
  controllers: [WaitlistController],
  providers: [WaitlistService],
  exports: [WaitlistService],
})
export class WaitlistModule {}
