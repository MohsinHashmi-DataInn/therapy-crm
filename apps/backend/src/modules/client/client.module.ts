import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

/**
 * Module for handling client management
 */
@Module({
  imports: [PrismaModule],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule {}
