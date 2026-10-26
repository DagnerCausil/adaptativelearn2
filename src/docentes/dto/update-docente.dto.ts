import { PartialType } from '@nestjs/mapped-types';
import { CreateDocenteDto } from './create-docente.dto.js';

export class UpdateDocenteDto extends PartialType(CreateDocenteDto) {}
