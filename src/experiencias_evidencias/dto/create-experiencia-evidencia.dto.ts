import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateExperienciaEvidenciaDto {
  @ApiProperty({
    description:
      'ObjectId de la evidencia. Debe pertenecer al mismo DBA de la experiencia.',
  })
  @IsMongoId()
  id_evidencia!: string;
}
