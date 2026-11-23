import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateInscripcionDto {
  @ApiProperty({ description: 'ObjectId del estudiante que se une.' })
  @IsMongoId()
  id_estudiante!: string;

  @ApiProperty({
    maxLength: 12,
    description: 'Código de invitación de la experiencia publicada.',
    example: 'K7M3QX9P',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(12)
  codigo_invitacion!: string;
}
