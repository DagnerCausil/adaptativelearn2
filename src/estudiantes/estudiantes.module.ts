import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Inscripcion, InscripcionSchema } from '../inscripciones/schemas/inscripcion.schema.js';
import { Estudiante, EstudianteSchema } from './schemas/estudiante.schema.js';
import { EstudiantesController } from './estudiantes.controller.js';
import { EstudiantesService } from './estudiantes.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Estudiante.name, schema: EstudianteSchema },
      { name: Inscripcion.name, schema: InscripcionSchema },
    ]),
  ],
  controllers: [EstudiantesController],
  providers: [EstudiantesService],
})
export class EstudiantesModule {}
