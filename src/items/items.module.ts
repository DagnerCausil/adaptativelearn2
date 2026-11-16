import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ExperienciaEvidencia,
  ExperienciaEvidenciaSchema,
} from '../experiencias_evidencias/schemas/experiencia-evidencia.schema.js';
import { Opcion, OpcionSchema } from '../opciones/schemas/opcion.schema.js';
import {
  Presentacion,
  PresentacionSchema,
} from '../presentaciones/schemas/presentacion.schema.js';
import { Item, ItemSchema } from './schemas/item.schema.js';
import { ItemsController } from './items.controller.js';
import { ItemsService } from './items.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Opcion.name, schema: OpcionSchema },
      { name: ExperienciaEvidencia.name, schema: ExperienciaEvidenciaSchema },
      { name: Presentacion.name, schema: PresentacionSchema },
    ]),
  ],
  controllers: [ItemsController],
  providers: [ItemsService],
  exports: [ItemsService],
})
export class ItemsModule {}
