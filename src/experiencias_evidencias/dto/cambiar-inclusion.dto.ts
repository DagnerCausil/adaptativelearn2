import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class CambiarInclusionDto {
  @ApiProperty({ description: 'true para incluir la evidencia, false para excluirla.' })
  @IsBoolean()
  incluida!: boolean;
}
