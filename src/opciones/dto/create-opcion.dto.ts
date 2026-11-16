import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { GRUPO_OPCION } from '../../common/enums.js';

export class CreateOpcionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  texto!: string;

  @ApiProperty({
    type: Number,
    description:
      'Posición correcta (ordering), número de pareja (matching) u orden de aparición (single_choice).',
  })
  @IsInt()
  orden!: number;

  @ApiProperty()
  @IsBoolean()
  es_correcta!: boolean;

  @ApiProperty({
    required: false,
    enum: GRUPO_OPCION,
    description: 'Solo en ítems matching.',
  })
  @IsOptional()
  @IsIn(GRUPO_OPCION)
  grupo?: (typeof GRUPO_OPCION)[number];

  @ApiProperty({
    required: false,
    description:
      'Qué error del estudiante revela elegir este distractor (ADR-020).',
  })
  @IsOptional()
  @IsString()
  hipotesis_error?: string;
}
