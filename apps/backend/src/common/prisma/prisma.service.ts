import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';

/**
 * Basic record interface for mock data
 */
interface MockRecord {
  id: bigint;
  [key: string]: any;
}

/**
 * Temporary mock PrismaService to bypass Prisma client generation issues
 * This implementation provides stub methods to allow the application to run
 * without requiring the actual Prisma client
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  
  // Mock data collections with proper typing
  private users: MockRecord[] = [];
  private clients: MockRecord[] = [];
  private waitlists: MockRecord[] = [];
  private appointments: MockRecord[] = [];
  private communications: MockRecord[] = [];
  private learners: MockRecord[] = [];

  // Create model proxies with basic CRUD functionality
  public user = this.createModelProxy('user');
  public client = this.createModelProxy('client');
  public waitlist = this.createModelProxy('waitlist');
  public appointment = this.createModelProxy('appointment');
  public communication = this.createModelProxy('communication');
  public learner = this.createModelProxy('learner');

  constructor() {
    this.logger.warn('Using MOCK PrismaService - For development only');
    this.logger.warn('Database operations will not persist between restarts');
  }

  async onModuleInit() {
    this.logger.log('Mock PrismaService initialized');
  }

  async onModuleDestroy() {
    this.logger.log('Mock PrismaService disconnected');
  }

  async $connect() {
    this.logger.log('Mock connection established');
  }

  async $disconnect() {
    this.logger.log('Mock connection closed');
  }

  /**
   * Helper to execute raw SQL queries (mock implementation returns empty results)
   */
  async $queryRaw(query: any, ...params: any[]): Promise<any[]> {
    this.logger.log(`Mock query execution: ${query}`);
    return [];
  }

  /**
   * Helper to execute raw SQL queries with no type safety (mock implementation returns empty results)
   */
  async $queryRawUnsafe(query: string, ...params: any[]): Promise<any[]> {
    this.logger.log(`Mock query execution (unsafe): ${query}`);
    return [];
  }

  /**
   * Helper to execute SQL transactions (mock implementation just executes the callback)
   */
  async $transaction<T>(callback: () => Promise<T>): Promise<T> {
    this.logger.log('Mock transaction started');
    const result = await callback();
    this.logger.log('Mock transaction completed');
    return result;
  }

  /**
   * Creates a model proxy with basic CRUD operations
   */
  private createModelProxy(modelName: string) {
    // Use indexer to properly access dynamic properties
    const dataStore = this[modelName === 'user' ? 'users' : 
                          modelName === 'client' ? 'clients' :
                          modelName === 'waitlist' ? 'waitlists' :
                          modelName === 'appointment' ? 'appointments' :
                          modelName === 'communication' ? 'communications' :
                          modelName === 'learner' ? 'learners' : 'users'];
    
    return {
      findUnique: async ({ where }: any) => {
        this.logger.log(`Mock ${modelName}.findUnique called with: ${JSON.stringify(where)}`);
        return null;
      },
      
      findMany: async (params?: any) => {
        this.logger.log(`Mock ${modelName}.findMany called with: ${JSON.stringify(params)}`);
        return [];
      },
      
      findFirst: async (params?: any) => {
        this.logger.log(`Mock ${modelName}.findFirst called with: ${JSON.stringify(params)}`);
        return null;
      },
      
      create: async ({ data }: any) => {
        this.logger.log(`Mock ${modelName}.create called with: ${JSON.stringify(data)}`);
        const id = BigInt(Date.now());
        const record: MockRecord = { id, ...data };
        dataStore.push(record);
        return record;
      },
      
      update: async ({ where, data }: any) => {
        this.logger.log(`Mock ${modelName}.update called with where: ${JSON.stringify(where)}, data: ${JSON.stringify(data)}`);
        return { id: BigInt(1), ...data };
      },
      
      delete: async ({ where }: any) => {
        this.logger.log(`Mock ${modelName}.delete called with: ${JSON.stringify(where)}`);
        return { id: BigInt(1) };
      },

      deleteMany: async (params?: any) => {
        this.logger.log(`Mock ${modelName}.deleteMany called with: ${JSON.stringify(params)}`);
        return { count: 0 };
      },
      
      count: async (params?: any) => {
        this.logger.log(`Mock ${modelName}.count called with: ${JSON.stringify(params)}`);
        return 0;
      }
    };
  }

  async cleanDatabase() {
    this.logger.log('Mock database cleaned');
    this.users = [];
    this.clients = [];
    this.waitlists = [];
    this.appointments = [];
    this.communications = [];
    this.learners = [];
  }
}
