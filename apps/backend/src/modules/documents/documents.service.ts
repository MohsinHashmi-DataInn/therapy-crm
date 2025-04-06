import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);

/**
 * Service for document management
 */
@Injectable()
export class DocumentsService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(private prisma: PrismaService) {
    // Ensure uploads directory exists
    this.ensureUploadsDir();
  }

  /**
   * Ensure the uploads directory exists
   * @private
   */
  private async ensureUploadsDir(): Promise<void> {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
    }
  }

  /**
   * Create a new document record and save the file
   * @param createDocumentDto - Document metadata
   * @param file - The uploaded file
   * @param uploaderId - ID of the user uploading the document
   * @returns The created document
   */
  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    uploaderId: bigint,
  ) {
    // Generate a unique filename to avoid collisions
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, uniqueFilename);

    try {
      // Save file to disk
      await writeFile(filePath, file.buffer);

      // Create document record in database
      return this.prisma.documents.create({
        data: {
          title: createDocumentDto.title,
          description: createDocumentDto.description,
          filename: uniqueFilename,
          original_filename: file.originalname,
          file_path: filePath,
          file_size: file.size,
          file_type: file.mimetype,
          category_id: createDocumentDto.category_id 
            ? BigInt(createDocumentDto.category_id) 
            : null,
          client_id: createDocumentDto.client_id 
            ? BigInt(createDocumentDto.client_id) 
            : null,
          upload_date: new Date(),
          uploader_id: uploaderId,
          security_classification: createDocumentDto.security_classification || 'INTERNAL',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: uploaderId,
          updated_by: uploaderId,
        },
      });
    } catch (error) {
      // Clean up file if database operation fails
      try {
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up file after error:', cleanupError);
      }
      
      throw error;
    }
  }

  /**
   * Find documents with optional filtering
   * @param options - Filter options for documents
   * @returns List of documents
   */
  async findAll(options: {
    categoryId?: bigint;
    clientId?: bigint;
    searchTerm?: string;
  }) {
    const { categoryId, clientId, searchTerm } = options;
    
    const where: any = {};
    
    if (categoryId) {
      where.category_id = categoryId;
    }
    
    if (clientId) {
      where.client_id = clientId;
    }
    
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { original_filename: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    return this.prisma.documents.findMany({
      where,
      include: {
        document_categories: true,
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_documents_uploaderTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        upload_date: 'desc',
      },
    });
  }

  /**
   * Find documents uploaded by a specific user
   * @param uploaderId - ID of the uploader
   * @returns List of documents
   */
  async findByUploader(uploaderId: bigint) {
    return this.prisma.documents.findMany({
      where: {
        uploader_id: uploaderId,
      },
      include: {
        document_categories: true,
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        upload_date: 'desc',
      },
    });
  }

  /**
   * Find one document by ID
   * @param id - Document ID
   * @returns The document
   * @throws NotFoundException if document not found
   */
  async findOne(id: bigint) {
    const document = await this.prisma.documents.findUnique({
      where: { id },
      include: {
        document_categories: true,
        clients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        users_documents_uploaderTousers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        document_permissions: {
          include: {
            users_document_permissions_user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    return document;
  }

  /**
   * Update a document
   * @param id - Document ID
   * @param updateDocumentDto - Updated document data
   * @param userId - ID of the user making the update
   * @returns The updated document
   * @throws NotFoundException if document not found
   */
  async update(id: bigint, updateDocumentDto: UpdateDocumentDto, userId: bigint) {
    try {
      // Get document to check permissions
      const document = await this.prisma.documents.findUnique({
        where: { id },
      });
      
      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }
      
      return await this.prisma.documents.update({
        where: { id },
        data: {
          title: updateDocumentDto.title,
          description: updateDocumentDto.description,
          category_id: updateDocumentDto.category_id 
            ? BigInt(updateDocumentDto.category_id) 
            : undefined,
          client_id: updateDocumentDto.client_id 
            ? BigInt(updateDocumentDto.client_id) 
            : undefined,
          security_classification: updateDocumentDto.security_classification,
          updated_at: new Date(),
          updated_by: userId,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete a document
   * @param id - Document ID
   * @returns The deleted document
   * @throws NotFoundException if document not found
   */
  async remove(id: bigint) {
    try {
      // Get document to get file path
      const document = await this.prisma.documents.findUnique({
        where: { id },
      });
      
      if (!document) {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }
      
      // Delete document from database
      const deletedDocument = await this.prisma.documents.delete({
        where: { id },
      });
      
      // Delete file from filesystem
      if (document.file_path) {
        try {
          await unlink(document.file_path);
        } catch (error) {
          console.error(`Failed to delete file: ${document.file_path}`, error);
        }
      }
      
      return deletedDocument;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Document with ID ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Download a document
   * @param id - Document ID
   * @returns The document file
   * @throws NotFoundException if document not found
   */
  async downloadDocument(id: bigint) {
    const document = await this.prisma.documents.findUnique({
      where: { id },
    });
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    
    if (!document.file_path || !fs.existsSync(document.file_path)) {
      throw new NotFoundException(`Document file not found`);
    }
    
    try {
      const fileContent = await readFile(document.file_path);
      
      return {
        buffer: fileContent,
        filename: document.original_filename,
        mimetype: document.file_type,
      };
    } catch (error) {
      console.error(`Failed to read file: ${document.file_path}`, error);
      throw new BadRequestException('Failed to read document file');
    }
  }

  /**
   * Grant permission to a user for a document
   * @param documentId - Document ID
   * @param userId - User ID to grant permission to
   * @param permissionType - Type of permission
   * @param granterId - ID of the user granting the permission
   * @returns The created permission
   */
  async grantPermission(
    documentId: bigint,
    userId: bigint,
    permissionType: string,
    granterId: bigint,
  ) {
    // Check if document exists
    const document = await this.prisma.documents.findUnique({
      where: { id: documentId },
    });
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }
    
    // Check if user exists
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    
    // Check if permission already exists
    const existingPermission = await this.prisma.document_permissions.findFirst({
      where: {
        document_id: documentId,
        user_id: userId,
      },
    });
    
    if (existingPermission) {
      return this.prisma.document_permissions.update({
        where: { id: existingPermission.id },
        data: {
          permission_type: permissionType,
          granted_at: new Date(),
          granted_by: granterId,
        },
      });
    }
    
    // Create new permission
    return this.prisma.document_permissions.create({
      data: {
        document_id: documentId,
        user_id: userId,
        permission_type: permissionType,
        granted_at: new Date(),
        granted_by: granterId,
      },
    });
  }

  /**
   * Revoke permission from a user for a document
   * @param documentId - Document ID
   * @param userId - User ID to revoke permission from
   * @param revokerId - ID of the user revoking the permission
   * @returns The deleted permission
   */
  async revokePermission(
    documentId: bigint,
    userId: bigint,
    revokerId: bigint,
  ) {
    // Find the permission
    const permission = await this.prisma.document_permissions.findFirst({
      where: {
        document_id: documentId,
        user_id: userId,
      },
    });
    
    if (!permission) {
      throw new NotFoundException(`Permission not found`);
    }
    
    // Delete the permission
    return this.prisma.document_permissions.delete({
      where: { id: permission.id },
    });
  }

  /**
   * Log document access
   * @param documentId - Document ID
   * @param userId - User ID accessing the document
   * @returns The created access log
   */
  async logAccess(documentId: bigint, userId: bigint) {
    return this.prisma.document_access_logs.create({
      data: {
        document_id: documentId,
        user_id: userId,
        access_timestamp: new Date(),
        access_type: 'VIEW',
      },
    });
  }

  /**
   * Get access logs for a document
   * @param documentId - Document ID
   * @returns List of access logs
   */
  async getAccessLogs(documentId: bigint) {
    // Check if document exists
    const document = await this.prisma.documents.findUnique({
      where: { id: documentId },
    });
    
    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }
    
    return this.prisma.document_access_logs.findMany({
      where: {
        document_id: documentId,
      },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: {
        access_timestamp: 'desc',
      },
    });
  }
}
