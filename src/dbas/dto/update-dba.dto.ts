import { PartialType } from '@nestjs/swagger';
import { CreateDbaDto } from './create-dba.dto.js';

export class UpdateDbaDto extends PartialType(CreateDbaDto) {}
