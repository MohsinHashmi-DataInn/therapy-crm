import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PracticeLocationsService } from './practice-locations.service';
import { PracticeLocationsController } from './practice-locations.controller';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { UserLocationsService } from './user-locations.service';
import { UserLocationsController } from './user-locations.controller';
import { ContentTranslationsService } from './content-translations.service';
import { ContentTranslationsController } from './content-translations.controller';

/**
 * Module for managing practice locations and related entities
 * Includes location management, room assignments, staff assignments, and translations
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    PracticeLocationsController,
    RoomsController,
    UserLocationsController,
    ContentTranslationsController,
  ],
  providers: [
    PracticeLocationsService,
    RoomsService,
    UserLocationsService,
    ContentTranslationsService,
  ],
  exports: [
    PracticeLocationsService,
    RoomsService,
    UserLocationsService,
    ContentTranslationsService,
  ],
})
export class PracticeLocationsModule {}
