import { 
  Controller, 
  Get, 
  Param, 
  Res, 
  UseGuards, 
  NotFoundException,
  InternalServerErrorException,
  StreamableFile
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/guards/roles.guard';
import { UserRole } from '../../modules/auth/guards/roles.guard';
import { Roles } from '../../modules/auth/decorators/roles.decorator';
import { InvoicePdfService } from './services/invoice-pdf.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('billing-invoices-pdf')
@Controller('billing/invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicePdfController {
  constructor(private readonly invoicePdfService: InvoicePdfService) {}

  @Get(':id/pdf')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.STAFF)
  @ApiOperation({ summary: 'Generate and download PDF for an invoice' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'PDF file stream returned'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Invoice not found' 
  })
  async downloadInvoicePdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const invoiceId = BigInt(id);
      const pdfPath = await this.invoicePdfService.generateInvoicePdf(invoiceId);
      
      const fileName = path.basename(pdfPath);
      const fileStream = fs.createReadStream(pdfPath);
      
      // Set appropriate headers for PDF download
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      });
      
      return new StreamableFile(fileStream);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error generating invoice PDF');
    }
  }

  @Get(':id/pdf/view')
  @Roles(UserRole.ADMIN, UserRole.THERAPIST, UserRole.STAFF)
  @ApiOperation({ summary: 'View PDF for an invoice in browser' })
  @ApiParam({ name: 'id', description: 'Invoice ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'PDF file stream returned for viewing'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Invoice not found' 
  })
  async viewInvoicePdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response
  ) {
    try {
      const invoiceId = BigInt(id);
      const pdfPath = await this.invoicePdfService.generateInvoicePdf(invoiceId);
      
      const fileStream = fs.createReadStream(pdfPath);
      
      // Set headers for inline PDF viewing in browser
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
      });
      
      return new StreamableFile(fileStream);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error generating invoice PDF');
    }
  }
}
