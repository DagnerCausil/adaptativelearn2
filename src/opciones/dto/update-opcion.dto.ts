import { PartialType } from '@nestjs/swagger';
import { CreateOpcionDto } from './create-opcion.dto.js';

export class UpdateOpcionDto extends PartialType(CreateOpcionDto) {}
