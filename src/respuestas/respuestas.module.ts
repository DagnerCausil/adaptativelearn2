import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from '../items/schemas/item.schema.js';
import { Opcion, OpcionSchema } from '../opciones/schemas/opcion.schema.js';
import {
  Presentacion,
  PresentacionSchema,
} from '../presentaciones/schemas/presentacion.schema.js';
import { Respuesta, RespuestaSchema } from './schemas/respuesta.schema.js';
import {
  RespuestaPresentacionesController,
  RespuestasController,
} from './respuestas.controller.js';
import { RespuestasService } from './respuestas.service.js';
import { RespuestasOpcionesModule } from '../respuestas_opciones/respuestas-opciones.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Respuesta.name, schema: RespuestaSchema },
      { name: Presentacion.name, schema: PresentacionSchema },
      { name: Item.name, schema: ItemSchema },
      { name: Opcion.name, schema: OpcionSchema },
    ]),
    RespuestasOpcionesModule,
  ],
  controllers: [RespuestasController, RespuestaPresentacionesController],
  providers: [RespuestasService],
})
export class RespuestasModule {}
