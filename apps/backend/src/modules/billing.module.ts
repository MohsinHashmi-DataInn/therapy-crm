import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { PrismaModule } from '../common/prisma/prisma.module'; // Corrected path

@Module({
  imports: [PrismaModule], // Add PrismaModule here
  controllers: [BillingController],
  providers: [BillingService]
})
export class BillingModule {}
