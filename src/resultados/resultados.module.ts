import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Experiencia,
  ExperienciaSchema,
} from '../experiencias/schemas/experiencia.schema.js';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaSchema,
} from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Inscripcion, InscripcionSchema } from '../inscripciones/schemas/inscripcion.schema.js';
import { Item, ItemSchema } from '../items/schemas/item.schema.js';
import {
  Presentacion,
  PresentacionSchema,
} from '../presentaciones/schemas/presentacion.schema.js';
import { Respuesta, RespuestaSchema } from '../respuestas/schemas/respuesta.schema.js';
import { Resultado, ResultadoSchema } from './schemas/resultado.schema.js';
import {
  ExperienciasReportesController,
  InscripcionesResultadosController,
  ResultadosController,
} from './resultados.controller.js';
import { ResultadosService } from './resultados.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resultado.name, schema: ResultadoSchema },
      { name: Inscripcion.name, schema: InscripcionSchema },
      { name: ExperienciaEvidencia.name, schema: ExperienciaEvidenciaSchema },
      { name: Presentacion.name, schema: PresentacionSchema },
      { name: Respuesta.name, schema: RespuestaSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Experiencia.name, schema: ExperienciaSchema },
    ]),
  ],
  controllers: [
    ResultadosController,
    InscripcionesResultadosController,
    ExperienciasReportesController,
  ],
  providers: [ResultadosService],
})
export class ResultadosModule {}
