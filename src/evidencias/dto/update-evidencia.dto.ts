import { PartialType } from '@nestjs/swagger';
import { CreateEvidenciaDto } from './create-evidencia.dto.js';

export class UpdateEvidenciaDto extends PartialType(CreateEvidenciaDto) {}
