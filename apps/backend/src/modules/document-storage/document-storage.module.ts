import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentStorageController } from './document-storage.controller';
import { DocumentStorageService } from './document-storage.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * Module for document storage functionality
 */
@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    MulterModule.register({
      dest: './uploads/temp',
    }),
  ],
  controllers: [DocumentStorageController],
  providers: [DocumentStorageService],
  exports: [DocumentStorageService],
})
export class DocumentStorageModule {}
