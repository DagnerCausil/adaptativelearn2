import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class FiltroExperienciasDto {
  @ApiPropertyOptional({ description: 'Filtra por el ObjectId del docente.' })
  @IsOptional()
  @IsMongoId()
  id_docente?: string;
}
