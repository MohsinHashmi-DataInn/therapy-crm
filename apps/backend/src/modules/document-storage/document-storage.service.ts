import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

/**
 * Service handling document storage operations with encryption
 */
@Injectable()
export class DocumentStorageService {
  private readonly uploadDir: string;
  private readonly encryptionAlgorithm = 'aes-256-cbc';

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Get upload directory from configuration or use default
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || path.join(process.cwd(), 'uploads');
    // Ensure upload directory exists
    this.ensureUploadDirExists();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  /**
   * Generate a secure file path for storage
   * @param userId - ID of the uploader
   * @param fileName - Original file name
   * @returns Secure file path
   */
  private generateSecureFilePath(userId: string, fileName: string): string {
    const timestamp = Date.now();
    const randomString = randomBytes(16).toString('hex');
    const fileExt = path.extname(fileName);
    const sanitizedFileName = `${timestamp}-${randomString}${fileExt}`;
    return path.join('user', userId, sanitizedFileName);
  }

  /**
   * Generate encryption key and IV for document encryption
   * @returns Object containing key and IV
   */
  private generateEncryptionKey() {
    const key = randomBytes(32); // 256 bits
    const iv = randomBytes(16); // 16 bytes for AES
    return { key, iv };
  }

  /**
   * Encrypt a file
   * @param filePath - Path to the input file
   * @param outputPath - Path to save the encrypted file
   * @param key - Encryption key
   * @param iv - Initialization vector
   */
  private async encryptFile(
    filePath: string,
    outputPath: string,
    key: Buffer,
    iv: Buffer,
  ): Promise<void> {
    const fileData = await fs.readFile(filePath);
    const cipher = createCipheriv(this.encryptionAlgorithm, key, iv);
    const encryptedData = Buffer.concat([
      cipher.update(fileData),
      cipher.final(),
    ]);
    await fs.writeFile(outputPath, encryptedData);
  }

  /**
   * Decrypt a file
   * @param filePath - Path to the encrypted file
   * @param outputPath - Path to save the decrypted file
   * @param key - Encryption key (from database)
   * @param iv - Initialization vector (from database)
   */
  private async decryptFile(
    filePath: string,
    outputPath: string,
    key: Buffer,
    iv: Buffer,
  ): Promise<void> {
    const encryptedData = await fs.readFile(filePath);
    const decipher = createDecipheriv(this.encryptionAlgorithm, key, iv);
    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final(),
    ]);
    await fs.writeFile(outputPath, decryptedData);
  }

  /**
   * Calculate file checksum (SHA-256)
   * @param filePath - Path to the file
   * @returns SHA-256 checksum of the file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const fileData = await fs.readFile(filePath);
    return createHash('sha256').update(fileData).digest('hex');
  }

  /**
   * Upload a document with optional encryption
   * @param file - Uploaded file object
   * @param createDocumentDto - Document metadata
   * @param userId - ID of the user uploading the document
   * @returns Created document record
   */
  async uploadDocument(
    file: Express.Multer.File,
    createDocumentDto: any,
    userId: bigint,
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('File is required');
    }

    // Check if client exists if clientId is provided
    if (createDocumentDto.clientId) {
      const client = await this.prismaService.clients.findUnique({
        where: { id: BigInt(createDocumentDto.clientId) },
      });

      if (!client) {
        throw new NotFoundException(`Client with ID ${createDocumentDto.clientId} not found`);
      }
    }

    // Check if learner exists if learnerId is provided
    if (createDocumentDto.learnerId) {
      const learner = await this.prismaService.learners.findUnique({
        where: { id: BigInt(createDocumentDto.learnerId) },
      });

      if (!learner) {
        throw new NotFoundException(`Learner with ID ${createDocumentDto.learnerId} not found`);
      }
    }

    // Check if category exists if categoryId is provided
    if (createDocumentDto.categoryId) {
      const category = await this.prismaService.document_categories.findUnique({
        where: { id: BigInt(createDocumentDto.categoryId) },
      });

      if (!category) {
        throw new NotFoundException(`Category with ID ${createDocumentDto.categoryId} not found`);
      }
    }

    // Generate secure file path
    const relativePath = this.generateSecureFilePath(userId.toString(), file.originalname);
    const fullPath = path.join(this.uploadDir, relativePath);
    const dirPath = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dirPath, { recursive: true });

    // Calculate checksum before encryption
    const tempFilePath = file.path;
    const checksum = await this.calculateChecksum(tempFilePath);

    // Process file encryption if enabled
    const isEncrypted = createDocumentDto.isEncrypted !== false; // True by default
    let encryptionKeyId = null;

    if (isEncrypted) {
      // Generate encryption key and IV
      const { key, iv } = this.generateEncryptionKey();
      
      // Encrypt the file
      await this.encryptFile(tempFilePath, fullPath, key, iv);
      
      // Store encryption key securely
      // In a production environment, you would use a key management service
      // Here we're storing the key and IV as hex strings for demonstration
      const keyHex = key.toString('hex');
      const ivHex = iv.toString('hex');
      
      // Save encryption details (simplified for this example)
      // In production, use a dedicated key management system
      encryptionKeyId = `${keyHex}:${ivHex}`;
    } else {
      // Just move the file without encryption
      await fs.copyFile(tempFilePath, fullPath);
    }

    // Clean up temp file
    await fs.unlink(tempFilePath);

    // Get file metadata
    const mimeType = mime.lookup(file.originalname) || 'application/octet-stream';
    const fileSize = file.size;

    // Calculate retention and expiration
    let expirationDate = null;
    if (createDocumentDto.expirationDate) {
      expirationDate = new Date(createDocumentDto.expirationDate);
    } else if (createDocumentDto.retentionPeriodDays) {
      expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + createDocumentDto.retentionPeriodDays);
    }

    // Create document record in database
    const document = await this.prismaService.documents.create({
      data: {
        title: createDocumentDto.title,
        description: createDocumentDto.description,
        file_path: relativePath,
        file_name: file.originalname,
        file_type: path.extname(file.originalname).substring(1), // Remove the dot
        file_size: BigInt(fileSize),
        mime_type: mimeType,
        category_id: createDocumentDto.categoryId ? BigInt(createDocumentDto.categoryId) : null,
        client_id: createDocumentDto.clientId ? BigInt(createDocumentDto.clientId) : null,
        learner_id: createDocumentDto.learnerId ? BigInt(createDocumentDto.learnerId) : null,
        uploader_id: userId,
        upload_date: new Date(),
        tags: createDocumentDto.tags || [],
        security_classification: createDocumentDto.securityClassification || 'CONFIDENTIAL',
        is_encrypted: isEncrypted,
        encryption_key_id: encryptionKeyId,
        checksum: checksum,
        retention_period_days: createDocumentDto.retentionPeriodDays || null,
        expiration_date: expirationDate,
        version: 1,
        is_latest_version: true,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: userId,
        updated_by: userId,
      },
    });

    // Add owner permission
    await this.prismaService.document_permissions.create({
      data: {
        document_id: document.id,
        user_id: userId,
        permission_type: 'OWNER',
        granted_by: userId,
        granted_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Log access for auditing
    await this.prismaService.document_access_logs.create({
      data: {
        document_id: document.id,
        user_id: userId,
        access_type: 'UPLOAD',
        access_timestamp: new Date(),
        access_status: 'SUCCESS',
      },
    });

    return document;
  }

  /**
   * Get document by ID with permission check
   * @param id - Document ID
   * @param userId - User ID requesting access
   * @returns Document object if authorized
   */
  async getDocumentById(id: number, userId: bigint) {
    const documentId = BigInt(id);
    
    // Get the document
    const document = await this.prismaService.documents.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check permission
    const hasPermission = await this.checkDocumentPermission(documentId, userId, ['VIEW', 'EDIT', 'OWNER']);
    
    if (!hasPermission) {
      throw new BadRequestException('You do not have permission to access this document');
    }

    // Log access for auditing
    await this.prismaService.document_access_logs.create({
      data: {
        document_id: documentId,
        user_id: userId,
        access_type: 'VIEW',
        access_timestamp: new Date(),
        access_status: 'SUCCESS',
      },
    });

    return document;
  }

  /**
   * Download a document
   * @param id - Document ID
   * @param userId - User ID requesting download
   * @returns Document data and metadata
   */
  async downloadDocument(id: number, userId: bigint) {
    const documentId = BigInt(id);
    
    // Get the document with permission check
    const document = await this.getDocumentById(id, userId);
    
    // Check download permission
    const hasPermission = await this.checkDocumentPermission(documentId, userId, ['DOWNLOAD', 'OWNER']);
    
    if (!hasPermission) {
      throw new BadRequestException('You do not have permission to download this document');
    }

    // Get file path
    const filePath = path.join(this.uploadDir, document.file_path);
    
    // For encrypted files, decrypt before sending
    let fileBuffer: Buffer;
    
    if (document.is_encrypted && document.encryption_key_id) {
      // Extract key and IV from stored value
      const [keyHex, ivHex] = document.encryption_key_id.split(':');
      const key = Buffer.from(keyHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      
      // Create a temporary decrypted file
      const tempFilePath = path.join(this.uploadDir, 'temp', `decrypted-${Date.now()}`);
      await fs.mkdir(path.dirname(tempFilePath), { recursive: true });
      
      await this.decryptFile(filePath, tempFilePath, key, iv);
      fileBuffer = await fs.readFile(tempFilePath);
      
      // Clean up temp file
      await fs.unlink(tempFilePath);
    } else {
      fileBuffer = await fs.readFile(filePath);
    }
    
    // Log access for auditing
    await this.prismaService.document_access_logs.create({
      data: {
        document_id: documentId,
        user_id: userId,
        access_type: 'DOWNLOAD',
        access_timestamp: new Date(),
        access_status: 'SUCCESS',
      },
    });
    
    return {
      file: fileBuffer,
      fileName: document.file_name,
      mimeType: document.mime_type,
      fileSize: Number(document.file_size),
    };
  }

  /**
   * Check if a user has specific permission for a document
   * @param documentId - Document ID
   * @param userId - User ID to check
   * @param permissionTypes - Array of permission types to check
   * @returns Boolean indicating if user has the permission
   */
  async checkDocumentPermission(
    documentId: bigint,
    userId: bigint,
    permissionTypes: string[],
  ): Promise<boolean> {
    // Check for direct user permission
    const userPermission = await this.prismaService.document_permissions.findFirst({
      where: {
        document_id: documentId,
        user_id: userId,
        permission_type: {
          in: permissionTypes,
        },
      },
    });

    if (userPermission) {
      return true;
    }

    // Check for role-based permission
    const userRoles = await this.prismaService.user_roles.findMany({
      where: {
        user_id: userId,
      },
      select: {
        role_id: true,
      },
    });

    const roleIds = userRoles.map((ur) => ur.role_id);

    if (roleIds.length > 0) {
      const rolePermission = await this.prismaService.document_permissions.findFirst({
        where: {
          document_id: documentId,
          role_id: {
            in: roleIds,
          },
          permission_type: {
            in: permissionTypes,
          },
        },
      });

      if (rolePermission) {
        return true;
      }
    }

    // Check if user is an admin (has special access)
    const isAdmin = await this.prismaService.user_roles.findFirst({
      where: {
        user_id: userId,
        roles: {
          name: 'ADMIN',
        },
      },
    });

    return !!isAdmin;
  }

  /**
   * Grant permission to a user for a document
   * @param documentId - Document ID
   * @param targetUserId - User to grant permission to
   * @param permissionType - Type of permission to grant
   * @param grantingUserId - User granting the permission
   * @param expiresAt - Optional expiration date
   * @returns The created permission
   */
  async grantUserPermission(
    documentId: number,
    targetUserId: number,
    permissionType: string,
    grantingUserId: bigint,
    expiresAt?: Date,
  ) {
    const docId = BigInt(documentId);
    
    // Check if document exists
    const document = await this.prismaService.documents.findUnique({
      where: { id: docId },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Check if granting user has OWNER permission
    const hasOwnerPermission = await this.checkDocumentPermission(docId, grantingUserId, ['OWNER']);
    
    if (!hasOwnerPermission) {
      throw new BadRequestException('You do not have permission to grant access to this document');
    }

    // Grant permission
    const permission = await this.prismaService.document_permissions.create({
      data: {
        document_id: docId,
        user_id: BigInt(targetUserId),
        permission_type: permissionType,
        granted_by: grantingUserId,
        granted_at: new Date(),
        expires_at: expiresAt,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Log for auditing
    await this.prismaService.document_access_logs.create({
      data: {
        document_id: docId,
        user_id: grantingUserId,
        access_type: 'GRANT_PERMISSION',
        access_timestamp: new Date(),
        access_status: 'SUCCESS',
        additional_details: `Granted ${permissionType} permission to user ${targetUserId}`,
      },
    });

    return permission;
  }

  /**
   * List documents accessible to a user
   * @param userId - User ID
   * @param filters - Optional filters (client, learner, category)
   * @returns List of accessible documents
   */
  async listAccessibleDocuments(userId: bigint, filters: any = {}) {
    // Get user's roles
    const userRoles = await this.prismaService.user_roles.findMany({
      where: {
        user_id: userId,
      },
      select: {
        role_id: true,
      },
    });

    const roleIds = userRoles.map((ur) => ur.role_id);

    // Build query for accessible documents
    const where: any = {
      OR: [
        // Documents where user has direct permission
        {
          document_permissions: {
            some: {
              user_id: userId,
            },
          },
        },
        // Documents where user's role has permission
        roleIds.length > 0 ? {
          document_permissions: {
            some: {
              role_id: {
                in: roleIds,
              },
            },
          },
        } : undefined,
        // Documents uploaded by this user
        {
          uploader_id: userId,
        },
      ].filter(Boolean),
    };

    // Apply additional filters
    if (filters.clientId) {
      where.client_id = BigInt(filters.clientId);
    }

    if (filters.learnerId) {
      where.learner_id = BigInt(filters.learnerId);
    }

    if (filters.categoryId) {
      where.category_id = BigInt(filters.categoryId);
    }

    if (filters.title) {
      where.title = {
        contains: filters.title,
        mode: 'insensitive',
      };
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Get documents
    const documents = await this.prismaService.documents.findMany({
      where,
      orderBy: {
        upload_date: 'desc',
      },
      take: filters.limit ? parseInt(filters.limit) : 100,
      skip: filters.offset ? parseInt(filters.offset) : 0,
    });

    // Get total count for pagination
    const totalCount = await this.prismaService.documents.count({
      where,
    });

    return {
      documents,
      totalCount,
      limit: filters.limit ? parseInt(filters.limit) : 100,
      offset: filters.offset ? parseInt(filters.offset) : 0,
    };
  }
}
