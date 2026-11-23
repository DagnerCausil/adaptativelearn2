import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class FiltroPresentacionesDto {
  @ApiProperty({ required: false, description: 'Filtra por inscripción.' })
  @IsOptional()
  @IsMongoId()
  id_inscripcion?: string;
}
