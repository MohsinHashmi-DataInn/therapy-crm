import { Controller, Get, Put, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { PracticeService } from './practice.service';
import { UpdatePracticeDto } from './dto/update-practice.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; 
import { RolesGuard, UserRole } from './auth/guards/roles.guard'; 
import { Roles } from './auth/decorators/roles.decorator'; 
import { Practice } from '@prisma/client'; 

@ApiTags('Practice')
@ApiBearerAuth() 
@Controller('practice')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.STAFF) 
  @ApiOperation({ summary: 'Get practice information' })
  @ApiResponse({ status: 200, description: 'Practice information retrieved successfully.' }) 
  @ApiResponse({ status: 404, description: 'Practice information not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getPracticeInfo(): Promise<Practice> {
    return this.practiceService.getPracticeInfo();
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
