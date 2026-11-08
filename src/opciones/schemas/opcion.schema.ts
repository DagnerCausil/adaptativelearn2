import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { GRUPO_OPCION } from '../../common/enums.js';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type OpcionDocument = HydratedDocument<Opcion>;

@Schema({ collection: 'opciones', versionKey: false })
export class Opcion {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Item', required: true })
  id_item!: Types.ObjectId;

  @Prop({ type: String, required: true })
  texto!: string;

  @Prop({ type: Number, required: true, validate: Number.isInteger })
  orden!: number;

  @Prop({ type: Boolean, required: true })
  es_correcta!: boolean;

  @Prop({ type: String, enum: GRUPO_OPCION })
  grupo?: (typeof GRUPO_OPCION)[number];

  @Prop({ type: String })
  hipotesis_error?: string;
}

export const OpcionSchema = SchemaFactory.createForClass(Opcion);
