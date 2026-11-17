import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

// fecha_dictamen no se recibe: la pone el servidor (AGENTS.md regla 6).
export class CreateDictamenEvidenciaDto {
  @ApiProperty({
    description: 'ObjectId de la evidencia dictaminada.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id_evidencia!: string;

  @ApiProperty({
    description: 'Si la evidencia admite pregunta cerrada (ADR-006).',
  })
  @IsBoolean()
  aplica_formato_cerrado!: boolean;

  @ApiProperty({ required: false, description: 'Justificación del equipo.' })
  @IsOptional()
  @IsString()
  justificacion?: string;
}
