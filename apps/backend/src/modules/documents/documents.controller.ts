import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException
} from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '../auth/guards/roles.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: 201, description: 'The document has been successfully uploaded.' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid file or data.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
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
        category_id: {
          type: 'string',
        },
        client_id: {
          type: 'string',
        },
        security_classification: {
          type: 'string',
          enum: ['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'],
        },
      },
    },
  })
  async create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    
    return this.documentsService.create(createDocumentDto, file, BigInt(user.id));
  }

  @Get()
  @ApiOperation({ summary: 'Get all documents' })
  @ApiResponse({ status: 200, description: 'Return all documents.' })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('clientId') clientId?: string,
    @Query('searchTerm') searchTerm?: string,
  ) {
    return this.documentsService.findAll({
      categoryId: categoryId ? BigInt(categoryId) : undefined,
      clientId: clientId ? BigInt(clientId) : undefined,
      searchTerm,
    });
  }

  @Get('my-documents')
  @ApiOperation({ summary: 'Get documents uploaded by the current user' })
  @ApiResponse({ status: 200, description: 'Return all documents uploaded by the current user.' })
  findMyDocuments(@CurrentUser() user: any) {
    return this.documentsService.findByUploader(BigInt(user.id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document by id' })
  @ApiResponse({ status: 200, description: 'Return a document by id.' })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    const document = await this.documentsService.findOne(BigInt(id));
    
    // Log access to the document
    await this.documentsService.logAccess(BigInt(id), BigInt(user.id));
    
    return document;
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download a document' })
  @ApiResponse({ status: 200, description: 'Document file stream.' })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  async downloadDocument(@Param('id') id: string, @CurrentUser() user: any) {
    // Log access to the document
    await this.documentsService.logAccess(BigInt(id), BigInt(user.id));
    
    return this.documentsService.downloadDocument(BigInt(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a document' })
  @ApiResponse({ status: 200, description: 'The document has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.update(BigInt(id), updateDocumentDto, BigInt(user.id));
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 200, description: 'The document has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Document not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(BigInt(id));
  }

  @Post(':id/permissions')
  @ApiOperation({ summary: 'Grant permission to a user for a document' })
  @ApiResponse({ status: 201, description: 'Permission has been successfully granted.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  grantPermission(
    @Param('id') documentId: string,
    @Body('userId') userId: string,
    @Body('permissionType') permissionType: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.documentsService.grantPermission(
      BigInt(documentId),
      BigInt(userId),
      permissionType,
      BigInt(currentUser.id),
    );
  }

  @Delete(':id/permissions/:userId')
  @ApiOperation({ summary: 'Remove permission from a user for a document' })
  @ApiResponse({ status: 200, description: 'Permission has been successfully removed.' })
  @ApiResponse({ status: 404, description: 'Permission not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  revokePermission(
    @Param('id') documentId: string,
    @Param('userId') userId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.documentsService.revokePermission(
      BigInt(documentId),
      BigInt(userId),
      BigInt(currentUser.id),
    );
  }

  @Get(':id/access-logs')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST)
  @ApiOperation({ summary: 'Get access logs for a document' })
  @ApiResponse({ status: 200, description: 'Return access logs for a document.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  getAccessLogs(@Param('id') id: string) {
    return this.documentsService.getAccessLogs(BigInt(id));
  }
}
