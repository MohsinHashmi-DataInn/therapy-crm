import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
// Use require for CommonJS modules
const PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';
import { Prisma } from '@prisma/client';

// Extended PDFKit text options type
interface PDFTextOptions extends PDFKit.Mixins.TextOptions {
  bold?: boolean;
}

/**
 * Service for generating PDF invoices
 */
@Injectable()
export class InvoicePdfService {
  private readonly logger = new Logger(InvoicePdfService.name);
  private readonly outputDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly prismaService: PrismaService) {
    // Create the output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a PDF invoice
   * @param invoiceId The ID of the invoice to generate a PDF for
   * @returns The path to the generated PDF file
   */
  async generateInvoicePdf(invoiceId: bigint): Promise<string> {
    try {
      // Get invoice details
      const invoice = await this.prismaService.$queryRaw<any>`
        SELECT i.*, c.*
        FROM "Invoice" i
        LEFT JOIN "Client" c ON i."clientId" = c.id
        WHERE i.id = ${invoiceId}
      `;
      
      if (!invoice || invoice.length === 0) {
        throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
      }
      
      // Get invoice items
      const invoiceItems = await this.prismaService.$queryRaw<any>`
        SELECT ii.*, sc.*
        FROM "InvoiceItem" ii
        LEFT JOIN "ServiceCode" sc ON ii."serviceCodeId" = sc.id
        WHERE ii."invoiceId" = ${invoiceId}
      `;
      
      // Get payments
      const payments = await this.prismaService.$queryRaw<any>`
        SELECT * FROM "Payment" WHERE "invoiceId" = ${invoiceId}
      `;
      
      // Get insurance claims
      const insuranceClaims = await this.prismaService.$queryRaw<any>`
        SELECT ic.*, ip.*
        FROM "InsuranceClaim" ic
        LEFT JOIN "InsuranceProvider" ip ON ic."insuranceProviderId" = ip.id
        WHERE ic."invoiceId" = ${invoiceId}
      `;
      
      // Combine all data
      const invoiceData = {
        ...invoice[0],
        items: invoiceItems,
        payments: payments,
        insuranceClaims: insuranceClaims
      };

      // Helper function to format dates
      const formatDate = (date: Date | string): string => {
        return new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };

      // Helper function to format status
      const formatStatus = (status: string): string => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };

      // Helper function to format amount
      const formatAmount = (amount: number): string => {
        return Number(amount).toFixed(2);
      };

      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });

      // Set file path
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `invoice_${invoiceData.invoiceNumber}_${timestamp}.pdf`;
      const filePath = path.join(this.outputDir, fileName);

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add company logo if exists
      const logoPath = path.join(process.cwd(), 'assets', 'logo.png');
      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, 50, { width: 100 });
        }
      } catch (error: any) {
        this.logger.warn(`Could not load logo: ${error.message}`);
        // Continue without logo
      }

      // Add title
      doc.fontSize(20)
         .text('INVOICE', { align: 'right' })
         .moveDown();

      // Add company and client information
      doc.fontSize(12)
         .text('Therapy CRM Solutions', 350, 50, { align: 'right' })
         .text('123 Therapy Lane', 350, 65, { align: 'right' })
         .text('Wellness City, CA 90210', 350, 80, { align: 'right' })
         .text('Phone: (555) 123-4567', 350, 95, { align: 'right' })
         .text('Email: billing@therapycrm.com', 350, 110, { align: 'right' });

      doc.fontSize(12)
         .text('Bill To:', 300, 160)
         .fontSize(10)
         .text(`${invoice.client.firstName} ${invoice.client.lastName}`)
         .text(invoice.client.address || 'No address provided')
         .text(`Phone: ${invoice.client.phone || 'N/A'}`)
         .text(`Email: ${invoice.client.email || 'N/A'}`)
         .moveDown(2);

      // Add invoice details
      doc.fontSize(16)
         .text('INVOICE', 50, 130);

      doc.fontSize(10)
         .text('Invoice #:', 50, 150)
         .text(invoiceData.invoiceNumber || '', 150, 150)

         .text('Date:', 50, 170)
         .text(formatDate(invoiceData.issueDate), 150, 170)

         .text('Due Date:', 350, 170)
         .text(formatDate(invoiceData.dueDate), 420, 170)

         .text('Status:', 50, 190)
         .text(formatStatus(invoiceData.status), 150, 190);

      // Add table headers
      let yPos = doc.y;
      doc.fontSize(10)
         .text('Description', 50, yPos)
         .text('Service Date', 200, yPos)
         .text('Service Code', 280, yPos)
         .text('Quantity', 350, yPos)
         .text('Rate', 400, yPos)
         .text('Amount', 450, yPos);

      // Add line
      doc.moveDown(0.5);
      yPos = doc.y;
      doc.moveTo(50, yPos)
         .lineTo(550, yPos)
         .stroke();
      doc.moveDown(0.5);

      // Add invoice items
      let totalAmount = 0;
      for (const item of invoiceData.items) {
        yPos = doc.y;
        doc.fontSize(10)
           .text(item.description, 50, yPos, { width: 140 });
        
        // Handle multi-line descriptions
        const textHeight = doc.heightOfString(item.description, { width: 140 });
        const newY = yPos + Math.max(textHeight, 15);
        
        doc.text(new Date(item.serviceDate).toLocaleDateString(), 200, yPos)
           .text(item.serviceCode?.code || 'N/A', 280, yPos)
           .text(item.quantity.toString(), 350, yPos)
           .text(`$${Number(item.rate).toFixed(2)}`, 400, yPos)
           .text(`$${Number(item.amount).toFixed(2)}`, 450, yPos);
        
        totalAmount += Number(item.amount);
        doc.y = newY;
        doc.moveDown(0.5);
      }

      // Add line
      yPos = doc.y;
      doc.moveTo(50, yPos)
         .lineTo(550, yPos)
         .stroke();
      doc.moveDown(0.5);

      // Add subtotal, discounts, taxes and total
      doc.fontSize(10)
         .text('Subtotal:', 350, doc.y)
         .text(`$${totalAmount.toFixed(2)}`, 450);

      if (invoiceData.discount > 0) {
        doc.text('Discount:', 350, doc.y)
           .text(`-$${Number(invoiceData.discount).toFixed(2)}`, 450);
      }

      if (invoiceData.tax > 0) {
        doc.text('Tax:', 350, doc.y)
           .text(`$${Number(invoiceData.tax).toFixed(2)}`, 450);
      }

      // Draw line above totals
      doc.moveTo(50, yPos)
         .lineTo(550, yPos)
         .stroke();
      
      // Add some padding
      yPos += 20;
      
      // Calculate amount due
      const amountPaid = Number(invoiceData.amountPaid) || 0;
      const amountDue = totalAmount - amountPaid;

      // Total
      doc.fontSize(12)
         .text('Total:', 350, doc.y)
         .text(`$${formatAmount(invoiceData.totalAmount || totalAmount)}`, 450, doc.y);
      
      // Amount paid
      if (amountPaid > 0) {
        doc.moveDown(0.5)
           .text('Amount Paid:', 350, doc.y)
           .text(`$${formatAmount(amountPaid)}`, 450, doc.y);
      }
      
      // Balance due
      doc.moveDown(0.5)
         .text('Balance Due:', 350, doc.y)
         .text(`$${formatAmount(amountDue)}`, 450, doc.y);

      // Payment history
      if (invoiceData.payments && invoiceData.payments.length > 0) {
        doc.moveDown(2)
           .fontSize(12)
           .text('Payment History', 50, doc.y)
           .moveDown(0.5);
        
        // Payment table headers
        doc.fontSize(10)
           .text('Date', 50, doc.y)
           .text('Method', 150, doc.y)
           .text('Amount', 450, doc.y);
        
        doc.moveTo(50, doc.y + 5)
           .lineTo(550, doc.y + 5)
           .stroke();
        
        // Payment details
        for (const payment of invoiceData.payments) {
          doc.moveDown(0.5)
             .text(formatDate(payment.date), 50, doc.y)
             .text(formatStatus(payment.method || 'Unknown'), 150, doc.y)
             .text(`$${formatAmount(payment.amount || 0)}`, 450, doc.y);
        }
      }

      // Insurance information
      if (invoiceData.insuranceClaims && invoiceData.insuranceClaims.length > 0) {
        doc.moveDown(2)
           .fontSize(12)
           .text('Insurance Information', 50, doc.y)
           .moveDown(0.5);
        
        for (const claim of invoiceData.insuranceClaims) {
          doc.fontSize(10)
             .text(`Provider: ${claim.name || 'Unknown Provider'}`, 50, doc.y)
             .text(`Policy #: ${claim.policyNumber || ''}`, 50, doc.y + 15)
             .text(`Claim #: ${claim.claimNumber || ''}`, 50, doc.y + 30)
             .text(`Status: ${formatStatus(claim.status || 'Unknown')}`, 50, doc.y + 45);
          
          doc.moveDown(3);
        }
      }
      
      // Notes
      if (invoiceData.notes) {
        doc.moveDown(2)
           .fontSize(12)
           .text('Notes', 50, doc.y)
           .moveDown(0.5);
        
        doc.fontSize(10)
           .text(invoiceData.notes, {
             width: 500,
             align: 'left'
           });
      }

      // Add footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        
        // Add page number
        doc.fontSize(8)
           .text(
             `Page ${i + 1} of ${pageCount}`, 
             50, 
             doc.page.height - 50, 
             { align: 'center', width: doc.page.width - 100 }
           );
        
        // Add footer text
        doc.fontSize(8)
           .text(
             'Thank you for your business. Please pay by the due date to avoid late fees.',
             50,
             doc.page.height - 35,
             { align: 'center', width: doc.page.width - 100 }
           );
      }

      // Finalize PDF
      doc.end();

      // Return promise that resolves when the stream is closed
      return new Promise<string>((resolve, reject) => {
        stream.on('finish', () => {
          this.logger.log(`Generated PDF invoice for invoice #${invoice.invoiceNumber} at ${filePath}`);
          resolve(filePath);
        });
        
        stream.on('error', (error) => {
          this.logger.error(`Failed to generate PDF invoice: ${error.message}`, error.stack);
          reject(error);
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const err = error as Error;
      this.logger.error(`Failed to generate PDF invoice: ${err.message}`, err.stack);
      throw error;
    }
  }
  
  /**
   * Get a URL for the invoice PDF
   * @param invoiceId The ID of the invoice
   * @returns URL to access the PDF
   */
  async getInvoicePdfUrl(invoiceId: bigint): Promise<string> {
    try {
      const filePath = await this.generateInvoicePdf(invoiceId);
      const fileName = path.basename(filePath);
      return `/uploads/${fileName}`;
    } catch (error: any) {
      this.logger.error(`Failed to get invoice PDF URL: ${error.message}`);
      throw error;
    }
  }
}
