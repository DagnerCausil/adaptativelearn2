import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Estudiante,
  EstudianteSchema,
} from '../estudiantes/schemas/estudiante.schema.js';
import {
  Experiencia,
  ExperienciaSchema,
} from '../experiencias/schemas/experiencia.schema.js';
import {
  Presentacion,
  PresentacionSchema,
} from '../presentaciones/schemas/presentacion.schema.js';
import {
  Inscripcion,
  InscripcionSchema,
} from './schemas/inscripcion.schema.js';
import { InscripcionesController } from './inscripciones.controller.js';
import { InscripcionesService } from './inscripciones.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inscripcion.name, schema: InscripcionSchema },
      { name: Estudiante.name, schema: EstudianteSchema },
      { name: Experiencia.name, schema: ExperienciaSchema },
      { name: Presentacion.name, schema: PresentacionSchema },
    ]),
  ],
  controllers: [InscripcionesController],
  providers: [InscripcionesService],
})
export class InscripcionesModule {}
