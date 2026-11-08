import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RespuestaOpcion,
  RespuestaOpcionSchema,
} from './schemas/respuesta-opcion.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RespuestaOpcion.name, schema: RespuestaOpcionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class RespuestasOpcionesModule {}
