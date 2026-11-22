import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaSchema,
} from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import {
  Inscripcion,
  InscripcionSchema,
} from '../inscripciones/schemas/inscripcion.schema.js';
import { Item, ItemSchema } from '../items/schemas/item.schema.js';
import { Opcion, OpcionSchema } from '../opciones/schemas/opcion.schema.js';
import {
  Respuesta,
  RespuestaSchema,
} from '../respuestas/schemas/respuesta.schema.js';
import {
  Presentacion,
  PresentacionSchema,
} from './schemas/presentacion.schema.js';
import {
  InscripcionesPresentacionesController,
  PresentacionesController,
} from './presentaciones.controller.js';
import { PresentacionesService } from './presentaciones.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Presentacion.name, schema: PresentacionSchema },
      { name: Inscripcion.name, schema: InscripcionSchema },
      { name: Respuesta.name, schema: RespuestaSchema },
      { name: ExperienciaEvidencia.name, schema: ExperienciaEvidenciaSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Opcion.name, schema: OpcionSchema },
    ]),
  ],
  controllers: [
    PresentacionesController,
    InscripcionesPresentacionesController,
  ],
  providers: [PresentacionesService],
})
export class PresentacionesModule {}
