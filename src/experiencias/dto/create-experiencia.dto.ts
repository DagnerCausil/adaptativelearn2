import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateExperienciaDto {
  @ApiProperty({ description: 'ObjectId del docente que arma la experiencia.' })
  @IsMongoId()
  id_docente!: string;

  @ApiProperty({ description: 'ObjectId del DBA sobre el que se diagnostica.' })
  @IsMongoId()
  id_dba!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre!: string;
}
