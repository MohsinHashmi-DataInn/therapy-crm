import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpdateBillingDto } from './dto/update-billing.dto';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard, UserRole } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { Practice } from '../types/prisma-models';

@ApiTags('Billing')
@ApiBearerAuth() 
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    @Inject(BillingService) private readonly billingService: BillingService,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get billing information for the practice' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved billing information or empty template if not yet created.',
    type: UpdateBillingDto, 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async getBillingInfo(): Promise<Partial<Practice> | object> {
    this.logger.log('Received request to get billing info');
    return this.billingService.getBillingInfo();
  }

  @Put()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update billing information for the practice' })
  @ApiBody({ type: UpdateBillingDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated billing information.',
    type: UpdateBillingDto, 
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Practice not found.' })
  async updateBillingInfo(
    @Body() updateBillingDto: UpdateBillingDto,
  ): Promise<Partial<Practice>> {
    this.logger.log(
      `Received request to update billing info: ${JSON.stringify(
        updateBillingDto,
      )}`,
    );
    return this.billingService.updateBillingInfo(updateBillingDto);
  }
}
