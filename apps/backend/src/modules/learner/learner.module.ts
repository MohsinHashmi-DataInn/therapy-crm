import { Module } from '@nestjs/common';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * Module for handling learner management
 */
@Module({
  imports: [PrismaModule],
  controllers: [LearnerController],
  providers: [LearnerService],
  exports: [LearnerService],
})
export class LearnerModule {}
