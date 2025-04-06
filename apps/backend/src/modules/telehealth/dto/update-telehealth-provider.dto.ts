import { PartialType } from '@nestjs/swagger';
import { CreateTelehealthProviderDto } from './create-telehealth-provider.dto';

export class UpdateTelehealthProviderDto extends PartialType(CreateTelehealthProviderDto) {}
