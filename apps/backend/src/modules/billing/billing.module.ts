import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { EmailModule } from '../../common/email/email.module';
import { InsuranceProvidersService } from './insurance-providers.service';
import { InsuranceProvidersController } from './insurance-providers.controller';
import { FundingProgramsService } from './funding-programs.service';
import { FundingProgramsController } from './funding-programs.controller';
import { ServiceCodesService } from './service-codes.service';
import { ServiceCodesController } from './service-codes.controller';
import { InvoicesService } from './invoices.service';
import { InvoicesController } from './invoices.controller';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { InsuranceClaimsService } from './insurance-claims.service';
import { InsuranceClaimsController } from './insurance-claims.controller';
import { BillingNotificationsService } from './services/billing-notifications.service';
import { InvoicePdfService } from './services/invoice-pdf.service';
import { BillingReportsService } from './services/billing-reports.service';
import { ReportsController } from './reports.controller';
import { InvoicePdfController } from './invoice-pdf.controller';

/**
 * Module for billing and financial management
 * Handles insurance providers, funding programs, invoicing, 
 * payments, insurance claim processing, reporting, and notifications
 */
@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [
    InsuranceProvidersController,
    FundingProgramsController,
    ServiceCodesController,
    InvoicesController,
    PaymentsController,
    InsuranceClaimsController,
    ReportsController,
    InvoicePdfController,
  ],
  providers: [
    InsuranceProvidersService,
    FundingProgramsService,
    ServiceCodesService,
    InvoicesService,
    PaymentsService,
    InsuranceClaimsService,
    BillingNotificationsService,
    InvoicePdfService,
    BillingReportsService,
  ],
  exports: [
    InsuranceProvidersService,
    FundingProgramsService,
    ServiceCodesService,
    InvoicesService,
    PaymentsService,
    InsuranceClaimsService,
    BillingNotificationsService,
    InvoicePdfService,
    BillingReportsService,
  ],
})
export class BillingModule {}
