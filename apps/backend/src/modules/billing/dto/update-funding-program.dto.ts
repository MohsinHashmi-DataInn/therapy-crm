import { PartialType } from '@nestjs/swagger';
import { CreateFundingProgramDto } from './create-funding-program.dto';

/**
 * DTO for updating a funding program
 * Extends CreateFundingProgramDto but makes all properties optional
 */
export class UpdateFundingProgramDto extends PartialType(CreateFundingProgramDto) {}
