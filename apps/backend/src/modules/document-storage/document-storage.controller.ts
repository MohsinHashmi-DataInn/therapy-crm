import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Body, 
  Param, 
  UseGuards, 
  BadRequestException,
  NotFoundException,
  Query,
  UseInterceptors,
  UploadedFile,
  StreamableFile,
  Res 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth,
  ApiConsumes,
  ApiBody 
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/guards/roles.guard';
import { DocumentStorageService } from './document-storage.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';

/**
 * Controller for managing document uploads, downloads, and permissions
 */
@ApiTags('document-storage')
@Controller('document-storage')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentStorageController {
  constructor(private readonly documentStorageService: DocumentStorageService) {}

  /**
   * Upload a document with metadata
   */
  @Post('upload')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Upload a document with metadata' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        categoryId: {
          type: 'integer',
        },
        clientId: {
          type: 'integer',
        },
        learnerId: {
          type: 'integer',
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        securityClassification: {
          type: 'string',
          enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
        },
        isEncrypted: {
          type: 'boolean',
          default: true,
        },
        retentionPeriodDays: {
          type: 'integer',
        },
        expirationDate: {
          type: 'string',
          format: 'date-time',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or file validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, cb) => {
          // Generate a safe temporary filename
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow specific file types based on secure MIME types
        const allowedMimeTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain',
          'text/csv',
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          return cb(null, true);
        }
        
        return cb(
          new BadRequestException(
            `Unsupported file type ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`,
          ),
          false,
        );
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @GetUser('id') userId: number,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      return await this.documentStorageService.uploadDocument(
        file,
        createDocumentDto,
        BigInt(userId),
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload document: ${error.message}`,
      );
    }
  }

  /**
   * Download a document by ID
   */
  @Get('download/:id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Download a document by ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Returns the document file' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async downloadDocument(
    @Param('id') id: string,
    @GetUser('id') userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const documentId = parseInt(id);
    if (isNaN(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }
    
    const document = await this.documentStorageService.downloadDocument(
      documentId,
      BigInt(userId),
    );
    
    // Set response headers
    res.set({
      'Content-Type': document.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      'Content-Length': document.fileSize,
    });
    
    return new StreamableFile(document.file);
  }

  /**
   * Get document metadata by ID
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Get document metadata by ID' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Returns the document metadata' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocumentById(
    @Param('id') id: string,
    @GetUser('id') userId: number,
  ) {
    const documentId = parseInt(id);
    if (isNaN(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }
    
    return this.documentStorageService.getDocumentById(
      documentId,
      BigInt(userId),
    );
  }

  /**
   * List documents accessible to the current user
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.RECEPTIONIST)
  @ApiOperation({ summary: 'List documents accessible to the current user' })
  @ApiQuery({ name: 'clientId', required: false, description: 'Filter by client ID' })
  @ApiQuery({ name: 'learnerId', required: false, description: 'Filter by learner ID' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiQuery({ name: 'title', required: false, description: 'Filter by title (partial match)' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags (comma-separated)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Maximum number of documents to return' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'Returns the list of accessible documents' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listAccessibleDocuments(
    @GetUser('id') userId: number,
    @Query() filters: any,
  ) {
    // Process tags if provided as a comma-separated string
    if (filters.tags && typeof filters.tags === 'string') {
      filters.tags = filters.tags.split(',').map(tag => tag.trim());
    }
    
    return this.documentStorageService.listAccessibleDocuments(
      BigInt(userId),
      filters,
    );
  }

  /**
   * Grant document access to another user
   */
  @Post(':id/grant-access')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Grant document access to another user' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'permissionType'],
      properties: {
        userId: {
          type: 'integer',
          description: 'User ID to grant permission to',
        },
        permissionType: {
          type: 'string',
          enum: ['VIEW', 'EDIT', 'DOWNLOAD', 'SHARE'],
          description: 'Type of permission to grant',
        },
        expiresAt: {
          type: 'string',
          format: 'date-time',
          description: 'Optional expiration date for the permission',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Permission granted successfully' })
  @ApiResponse({ status: 400, description: 'Bad request or insufficient permissions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Document or user not found' })
  async grantDocumentAccess(
    @Param('id') id: string,
    @Body() grantDto: { userId: number; permissionType: string; expiresAt?: string },
    @GetUser('id') grantingUserId: number,
  ) {
    const documentId = parseInt(id);
    if (isNaN(documentId)) {
      throw new BadRequestException('Invalid document ID');
    }
    
    if (!grantDto.userId || !grantDto.permissionType) {
      throw new BadRequestException('User ID and permission type are required');
    }
    
    // Validate permission type
    const validPermissions = ['VIEW', 'EDIT', 'DOWNLOAD', 'SHARE'];
    if (!validPermissions.includes(grantDto.permissionType)) {
      throw new BadRequestException(
        `Invalid permission type. Must be one of: ${validPermissions.join(', ')}`,
      );
    }
    
    let expiresAt = undefined;
    if (grantDto.expiresAt) {
      expiresAt = new Date(grantDto.expiresAt);
      if (isNaN(expiresAt.getTime())) {
        throw new BadRequestException('Invalid expiration date format');
      }
    }
    
    return this.documentStorageService.grantUserPermission(
      documentId,
      grantDto.userId,
      grantDto.permissionType,
      BigInt(grantingUserId),
      expiresAt,
    );
  }
}
