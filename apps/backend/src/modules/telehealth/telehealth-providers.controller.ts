import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TelehealthProvidersService } from './telehealth-providers.service';
import { CreateTelehealthProviderDto } from './dto/create-telehealth-provider.dto';
import { UpdateTelehealthProviderDto } from './dto/update-telehealth-provider.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '../auth/guards/roles.guard';

@ApiTags('telehealth-providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('telehealth-providers')
export class TelehealthProvidersController {
  constructor(private readonly telehealthProvidersService: TelehealthProvidersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new telehealth provider' })
  @ApiResponse({ status: 201, description: 'The telehealth provider has been successfully created.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createTelehealthProviderDto: CreateTelehealthProviderDto) {
    return this.telehealthProvidersService.create(createTelehealthProviderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all telehealth providers' })
  @ApiResponse({ status: 200, description: 'Return all telehealth providers.' })
  findAll(@Query('active') active?: string) {
    return this.telehealthProvidersService.findAll(active === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a telehealth provider by id' })
  @ApiResponse({ status: 200, description: 'Return a telehealth provider by id.' })
  @ApiResponse({ status: 404, description: 'Telehealth provider not found.' })
  findOne(@Param('id') id: string) {
    return this.telehealthProvidersService.findOne(BigInt(id));
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a telehealth provider' })
  @ApiResponse({ status: 200, description: 'The telehealth provider has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Telehealth provider not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(
    @Param('id') id: string,
    @Body() updateTelehealthProviderDto: UpdateTelehealthProviderDto,
  ) {
    return this.telehealthProvidersService.update(BigInt(id), updateTelehealthProviderDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a telehealth provider' })
  @ApiResponse({ status: 200, description: 'The telehealth provider has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Telehealth provider not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.telehealthProvidersService.remove(BigInt(id));
  }
}
