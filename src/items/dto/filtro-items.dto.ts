import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsOptional } from 'class-validator';

export class FiltroItemsDto {
  @ApiProperty({
    required: false,
    description: 'Filtra por la evidencia seleccionada en la experiencia.',
  })
  @IsOptional()
  @IsMongoId()
  id_experiencia_evidencia?: string;
}
