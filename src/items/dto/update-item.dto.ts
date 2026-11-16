import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateItemDto } from './create-item.dto.js';

export class UpdateItemDto extends PartialType(
  PickType(CreateItemDto, ['enunciado', 'formato'] as const),
) {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  excluido?: boolean;
}
