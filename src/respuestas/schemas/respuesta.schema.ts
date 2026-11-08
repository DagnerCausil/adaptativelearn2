import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type RespuestaDocument = HydratedDocument<Respuesta>;

@Schema({ collection: 'respuestas', versionKey: false })
export class Respuesta {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Presentacion',
    required: true,
    unique: true,
  })
  id_presentacion!: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 0,
    max: 5,
    validate: Number.isInteger,
  })
  certeza!: number;

  @Prop({ type: Boolean, required: true })
  correcta!: boolean;

  @Prop({ type: Date, required: true, default: Date.now })
  fecha_respuesta!: Date;
}

export const RespuestaSchema = SchemaFactory.createForClass(Respuesta);
