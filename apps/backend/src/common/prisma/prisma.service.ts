import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TypedPrismaClient, createTypedPrismaClient } from './prisma.types';

/**
 * Real PrismaService implementation that provides a wrapper around the PrismaClient
 * This service connects to the actual PostgreSQL database using connection details from .env
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // Add BigInt serialization support for JSON
    (BigInt.prototype as any).toJSON = function() {
      return this.toString();
    };

    this.logger.log('Real PrismaService initialized - Connected to PostgreSQL database');
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established successfully');
      
      // Log connection info for debugging
      const serverVersion = await this.$queryRaw`SELECT version();`;
      this.logger.log(`Connected to PostgreSQL server: ${JSON.stringify(serverVersion)}`);
      
      // Setup event listeners
      // Using 'as any' to work around TypeScript constraints with Prisma event system
      (this as any).$on('query', (e: any) => {
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug(`Query: ${e.query}`);
          this.logger.debug(`Duration: ${e.duration}ms`);
        }
      });
    } catch (error) {
      this.logger.error('Failed to connect to the database:');
      this.logger.error(error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Database connection closed successfully');
    } catch (error) {
      this.logger.error('Error disconnecting from database:');
      this.logger.error(error);
    }
  }
}
