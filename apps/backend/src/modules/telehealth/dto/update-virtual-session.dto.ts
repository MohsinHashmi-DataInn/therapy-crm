import { PartialType } from '@nestjs/swagger';
import { CreateVirtualSessionDto } from './create-virtual-session.dto';

export class UpdateVirtualSessionDto extends PartialType(CreateVirtualSessionDto) {}
