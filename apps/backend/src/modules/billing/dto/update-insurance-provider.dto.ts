import { PartialType } from '@nestjs/swagger';
import { CreateInsuranceProviderDto } from './create-insurance-provider.dto';

/**
 * DTO for updating an insurance provider
 * Extends CreateInsuranceProviderDto but makes all properties optional
 */
export class UpdateInsuranceProviderDto extends PartialType(CreateInsuranceProviderDto) {}
