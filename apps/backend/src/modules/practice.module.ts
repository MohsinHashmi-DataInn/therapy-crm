import { Module } from '@nestjs/common';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { BillingModule } from './billing.module';

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService]
})
export class PracticeModule {}
