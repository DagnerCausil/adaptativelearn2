import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dba, DbaSchema } from '../dbas/schemas/dba.schema.js';
import { Docente, DocenteSchema } from '../docentes/schemas/docente.schema.js';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaSchema,
} from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import {
  Inscripcion,
  InscripcionSchema,
} from '../inscripciones/schemas/inscripcion.schema.js';
import { ItemsModule } from '../items/items.module.js';
import { Item, ItemSchema } from '../items/schemas/item.schema.js';
import { ExperienciasController } from './experiencias.controller.js';
import { ExperienciasService } from './experiencias.service.js';
import { Experiencia, ExperienciaSchema } from './schemas/experiencia.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Experiencia.name, schema: ExperienciaSchema },
      { name: Docente.name, schema: DocenteSchema },
      { name: Dba.name, schema: DbaSchema },
      { name: ExperienciaEvidencia.name, schema: ExperienciaEvidenciaSchema },
      { name: Inscripcion.name, schema: InscripcionSchema },
      { name: Item.name, schema: ItemSchema },
    ]),
    ItemsModule,
  ],
  controllers: [ExperienciasController],
  providers: [ExperienciasService],
  exports: [ExperienciasService],
})
export class ExperienciasModule {}
