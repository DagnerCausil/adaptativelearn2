import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export const DECISIONES_REVISION = ['aprobado', 'rechazado'] as const;

export class RevisionItemDto {
  @ApiProperty({ enum: DECISIONES_REVISION })
  @IsIn(DECISIONES_REVISION)
  estado_revision!: (typeof DECISIONES_REVISION)[number];
}
