import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDictamenEvidenciaDto } from './create-dictamen-evidencia.dto.js';

// La evidencia de un dictamen no se cambia: para otra evidencia se crea otro dictamen.
export class UpdateDictamenEvidenciaDto extends PartialType(
  OmitType(CreateDictamenEvidenciaDto, ['id_evidencia'] as const),
) {}
