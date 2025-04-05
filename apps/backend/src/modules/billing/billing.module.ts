import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
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

/**
 * Module for billing and financial management
 * Handles insurance providers, funding programs, invoicing, 
 * payments, and insurance claim processing
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    InsuranceProvidersController,
    FundingProgramsController,
    ServiceCodesController,
    InvoicesController,
    PaymentsController,
    InsuranceClaimsController,
  ],
  providers: [
    InsuranceProvidersService,
    FundingProgramsService,
    ServiceCodesService,
    InvoicesService,
    PaymentsService,
    InsuranceClaimsService,
  ],
  exports: [
    InsuranceProvidersService,
    FundingProgramsService,
    ServiceCodesService,
    InvoicesService,
    PaymentsService,
    InsuranceClaimsService,
  ],
})
export class BillingModule {}
