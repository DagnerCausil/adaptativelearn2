import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDbaDto {
  @ApiProperty({ maxLength: 20, description: 'Código único del DBA.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  codigo!: string;

  @ApiProperty({ maxLength: 60, description: 'Área curricular del MEN.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  area!: string;

  @ApiProperty({ type: 'integer', description: 'Grado escolar.' })
  @IsInt()
  grado!: number;

  @ApiProperty({ description: 'Enunciado oficial del DBA.' })
  @IsString()
  @IsNotEmpty()
  enunciado!: string;

  @ApiProperty({ required: false, description: 'Ejemplo oficial del DBA.' })
  @IsOptional()
  @IsString()
  ejemplo?: string;
}
