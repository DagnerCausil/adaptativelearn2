import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RespuestaOpcionDocument = HydratedDocument<RespuestaOpcion>;

@Schema({ collection: 'respuestas_opciones', versionKey: false })
export class RespuestaOpcion {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Respuesta',
    required: true,
  })
  id_respuesta!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Opcion', required: true })
  id_opcion!: Types.ObjectId;

  @Prop({ type: Number, validate: Number.isInteger })
  valor_dado?: number;
}

export const RespuestaOpcionSchema = SchemaFactory.createForClass(RespuestaOpcion);
RespuestaOpcionSchema.index(
  { id_respuesta: 1, id_opcion: 1 },
  { unique: true },
);
