import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { DocumentCategoriesService } from './document-categories.service';
import { CreateDocumentCategoryDto } from './dto/create-document-category.dto';
import { UpdateDocumentCategoryDto } from './dto/update-document-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../auth/guards/roles.guard';

@ApiTags('document-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('document-categories')
export class DocumentCategoriesController {
  constructor(private readonly documentCategoriesService: DocumentCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new document category' })
  @ApiResponse({ status: 201, description: 'The document category has been successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createDocumentCategoryDto: CreateDocumentCategoryDto) {
    return this.documentCategoriesService.create(createDocumentCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all document categories' })
  @ApiResponse({ status: 200, description: 'Return all document categories.' })
  findAll(@Query('active') active?: string) {
    return this.documentCategoriesService.findAll(active === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a document category by id' })
  @ApiResponse({ status: 200, description: 'Return a document category by id.' })
  @ApiResponse({ status: 404, description: 'Document category not found.' })
  findOne(@Param('id') id: string) {
    return this.documentCategoriesService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a document category' })
  @ApiResponse({ status: 200, description: 'The document category has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Document category not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id') id: string,
    @Body() updateDocumentCategoryDto: UpdateDocumentCategoryDto,
  ) {
    return this.documentCategoriesService.update(BigInt(id), updateDocumentCategoryDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a document category' })
  @ApiResponse({ status: 200, description: 'The document category has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Document category not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.documentCategoriesService.remove(BigInt(id));
  }
}
