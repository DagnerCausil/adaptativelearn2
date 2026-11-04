import { PartialType } from '@nestjs/mapped-types';
import { CreateEstudianteDto } from './create-estudiante.dto.js';

export class UpdateEstudianteDto extends PartialType(CreateEstudianteDto) {}
