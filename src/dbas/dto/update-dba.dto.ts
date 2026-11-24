import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDbaDto } from './create-dba.dto.js';

// codigo no se cambia: es la clave con la que el seed encuentra cada DBA;
// renombrarlo haría que el seed creara un DBA duplicado. Con
// forbidNonWhitelisted, enviarlo da 400.
export class UpdateDbaDto extends PartialType(
  OmitType(CreateDbaDto, ['codigo'] as const),
) {}
