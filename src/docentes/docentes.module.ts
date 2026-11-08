import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Experiencia, ExperienciaSchema } from '../experiencias/schemas/experiencia.schema.js';
import { Docente, DocenteSchema } from './schemas/docente.schema.js';
import { DocentesController } from './docentes.controller.js';
import { DocentesService } from './docentes.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Docente.name, schema: DocenteSchema },
      { name: Experiencia.name, schema: ExperienciaSchema },
    ]),
  ],
  controllers: [DocentesController],
  providers: [DocentesService],
})
export class DocentesModule {}
