import { PartialType, PickType } from '@nestjs/swagger';
import { CreateExperienciaDto } from './create-experiencia.dto.js';

/** Solo se puede cambiar el nombre, y solo mientras la experiencia está en borrador. */
export class UpdateExperienciaDto extends PartialType(
  PickType(CreateExperienciaDto, ['nombre'] as const),
) {}
