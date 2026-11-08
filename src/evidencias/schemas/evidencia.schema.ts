import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type EvidenciaDocument = HydratedDocument<Evidencia>;

@Schema({ collection: 'evidencias', versionKey: false })
export class Evidencia {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dba', required: true })
  id_dba!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, validate: Number.isInteger })
  numero!: number;

  @Prop({ type: String, required: true })
  enunciado!: string;
}

export const EvidenciaSchema = SchemaFactory.createForClass(Evidencia);
EvidenciaSchema.index({ id_dba: 1, numero: 1 }, { unique: true });
