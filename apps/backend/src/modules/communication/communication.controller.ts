import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommunicationService } from './communication.service';
import { 
  CreateCommunicationDto, 
  UpdateCommunicationDto,
  CommunicationTemplateDto
} from './dto/communication.dto';
import { CommunicationType, CommunicationStatus } from '@prisma/client';

@ApiTags('communications')
@Controller('communications')
export class CommunicationController {
  constructor(private readonly communicationService: CommunicationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new communication log entry' })
  @ApiResponse({ status: 201, description: 'Communication successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createCommunicationDto: CreateCommunicationDto) {
    return this.communicationService.create(createCommunicationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all communications with optional filtering' })
  @ApiResponse({ status: 200, description: 'Return all communications' })
  async findAll(
    @Query('type') type?: CommunicationType,
    @Query('status') status?: CommunicationStatus,
    @Query('clientId') clientId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.communicationService.findAll({
      type,
      status,
      clientId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a communication by id' })
  @ApiResponse({ status: 200, description: 'Return the communication' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  async findOne(@Param('id') id: string) {
    return this.communicationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a communication' })
  @ApiResponse({ status: 200, description: 'Communication successfully updated' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  async update(@Param('id') id: string, @Body() updateCommunicationDto: UpdateCommunicationDto) {
    return this.communicationService.update(id, updateCommunicationDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a communication' })
  @ApiResponse({ status: 200, description: 'Communication successfully deleted' })
  @ApiResponse({ status: 404, description: 'Communication not found' })
  async remove(@Param('id') id: string) {
    return this.communicationService.remove(id);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get all communications for a specific client' })
  @ApiResponse({ status: 200, description: 'Return all communications for the client' })
  async findByClient(@Param('clientId') clientId: string) {
    return this.communicationService.findByClient(clientId);
  }

  @Post('send-template')
  @ApiOperation({ summary: 'Send a communication using a template' })
  @ApiResponse({ status: 201, description: 'Communication successfully sent' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async sendTemplate(
    @Body('clientId') clientId: string,
    @Body('templateName') templateName: string,
    @Body('replacements') replacements: Record<string, string>,
  ) {
    return this.communicationService.sendTemplate(clientId, templateName, replacements);
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create a new communication template' })
  @ApiResponse({ status: 201, description: 'Template successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createTemplate(@Body() templateDto: CommunicationTemplateDto) {
    return this.communicationService.createTemplate(templateDto);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all communication templates' })
  @ApiResponse({ status: 200, description: 'Return all templates' })
  async getTemplates() {
    return this.communicationService.getTemplates();
  }

  @Get('templates/:name')
  @ApiOperation({ summary: 'Get a communication template by name' })
  @ApiResponse({ status: 200, description: 'Return the template' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplateByName(@Param('name') name: string) {
    return this.communicationService.getTemplateByName(name);
  }
}
