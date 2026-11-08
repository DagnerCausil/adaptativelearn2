import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsMongoId,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateRespuestaOpcionDto } from './create-respuesta-opcion.dto.js';

export class CreateRespuestaDto {
  @ApiProperty({ description: 'ObjectId de la presentación respondida.' })
  @IsMongoId()
  id_presentacion!: string;

  @ApiProperty({ minimum: 0, maximum: 5, type: Number })
  @IsInt()
  @Min(0)
  @Max(5)
  certeza!: number;

  @ApiProperty({ type: [CreateRespuestaOpcionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateRespuestaOpcionDto)
  opciones!: CreateRespuestaOpcionDto[];
}
