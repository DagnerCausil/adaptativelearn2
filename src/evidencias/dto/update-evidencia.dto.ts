import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEvidenciaDto } from './create-evidencia.dto.js';

// id_dba no se cambia: la evidencia es entidad débil del DBA (identidad
// { id_dba, numero }) y moverla rompería la coherencia con las experiencias
// que ya la seleccionaron. Con forbidNonWhitelisted, enviarlo da 400.
export class UpdateEvidenciaDto extends PartialType(
  OmitType(CreateEvidenciaDto, ['id_dba'] as const),
) {}
