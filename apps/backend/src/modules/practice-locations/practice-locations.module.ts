import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { PracticeLocationsService } from './practice-locations.service';
import { PracticeLocationsController } from './practice-locations.controller';

/**
 * Module for managing practice locations and related entities
 * Includes location management, room assignments, staff assignments, and translations
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    PracticeLocationsController,
  ],
  providers: [
    PracticeLocationsService,
  ],
  exports: [
    PracticeLocationsService,
  ],
})
export class PracticeLocationsModule {}
