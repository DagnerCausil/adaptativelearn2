import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Item, ItemSchema } from '../items/schemas/item.schema.js';
import {
  Presentacion,
  PresentacionSchema,
} from '../presentaciones/schemas/presentacion.schema.js';
import {
  RespuestaOpcion,
  RespuestaOpcionSchema,
} from '../respuestas_opciones/schemas/respuesta-opcion.schema.js';
import { Opcion, OpcionSchema } from './schemas/opcion.schema.js';
import {
  ItemOpcionesController,
  OpcionesController,
} from './opciones.controller.js';
import { OpcionesService } from './opciones.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Opcion.name, schema: OpcionSchema },
      { name: Item.name, schema: ItemSchema },
      { name: RespuestaOpcion.name, schema: RespuestaOpcionSchema },
      { name: Presentacion.name, schema: PresentacionSchema },
    ]),
  ],
  controllers: [ItemOpcionesController, OpcionesController],
  providers: [OpcionesService],
})
export class OpcionesModule {}
