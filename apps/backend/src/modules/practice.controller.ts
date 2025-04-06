import { Controller, Get, Put, Body, UseGuards, UsePipes, ValidationPipe, NotFoundException } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; 
import { RolesGuard } from './auth/guards/roles.guard';
import { UserRole } from '../types/prisma-models'; 
import { Roles } from './auth/decorators/roles.decorator'; 
import { Practice } from '../types/prisma-models'; 

@ApiTags('Practice')
@ApiBearerAuth() 
@Controller('practice')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.STAFF) 
  @ApiOperation({ summary: 'Get practice information' })
  @ApiResponse({ status: 200, description: 'Practice information retrieved successfully or empty object if not initialized.' }) 
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getPracticeInfo(): Promise<Practice | object> {
    const practiceInfo = await this.practiceService.getPracticeInfo();
    if (!practiceInfo) {
      // Return an empty object instead of an error
      return {
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        website: '',
        hoursOfOperation: ''
      };
    }
    return practiceInfo;
  }

  @Put()
  @Roles(UserRole.ADMIN) 
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) 
  @ApiOperation({ summary: 'Update practice information' })
  @ApiResponse({ status: 200, description: 'Practice information updated successfully.' }) 
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Practice information not found.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' }) 
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async updatePracticeInfo(@Body() updatePracticeDto: UpdatePracticeDto): Promise<Practice> {
    return this.practiceService.updatePracticeInfo(updatePracticeDto);
  }
}
