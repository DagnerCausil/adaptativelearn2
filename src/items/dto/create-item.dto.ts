import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { FORMATO_ITEM, ORIGEN_ITEM } from '../../common/enums.js';

export class CreateItemDto {
  @ApiProperty({
    description: 'ObjectId de la evidencia seleccionada en la experiencia.',
  })
  @IsMongoId()
  id_experiencia_evidencia!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  enunciado!: string;

  @ApiProperty({ enum: FORMATO_ITEM })
  @IsIn(FORMATO_ITEM)
  formato!: (typeof FORMATO_ITEM)[number];

  @ApiProperty({ enum: ORIGEN_ITEM })
  @IsIn(ORIGEN_ITEM)
  origen!: (typeof ORIGEN_ITEM)[number];
}
