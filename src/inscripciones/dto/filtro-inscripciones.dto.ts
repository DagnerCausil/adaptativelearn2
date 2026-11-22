import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class FiltroInscripcionesDto {
  @ApiProperty({ required: false, description: 'Filtra por estudiante.' })
  @IsOptional()
  @IsMongoId()
  id_estudiante?: string;

  @ApiProperty({ required: false, description: 'Filtra por experiencia.' })
  @IsOptional()
  @IsMongoId()
  id_experiencia?: string;
}
