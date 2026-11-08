import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional } from 'class-validator';

export class CreateRespuestaOpcionDto {
  @ApiProperty({ description: 'ObjectId de la opción seleccionada.' })
  @IsMongoId()
  id_opcion!: string;

  @ApiProperty({
    required: false,
    description: 'Posición asignada o número de pareja según el formato.',
  })
  @IsOptional()
  @IsInt()
  valor_dado?: number;
}
