import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateEvidenciaDto {
  @ApiProperty({
    description: 'ObjectId del DBA al que pertenece la evidencia.',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  id_dba!: string;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    description: 'Número de la evidencia dentro del DBA.',
  })
  @IsInt()
  @Min(1)
  numero!: number;

  @ApiProperty({ description: 'Enunciado oficial de la evidencia.' })
  @IsString()
  @IsNotEmpty()
  enunciado!: string;
}
