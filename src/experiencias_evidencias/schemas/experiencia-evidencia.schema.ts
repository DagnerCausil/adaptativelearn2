import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ExperienciaEvidenciaDocument = HydratedDocument<ExperienciaEvidencia>;

@Schema({ collection: 'experiencias_evidencias', versionKey: false })
export class ExperienciaEvidencia {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Experiencia',
    required: true,
  })
  id_experiencia!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Evidencia', required: true })
  id_evidencia!: Types.ObjectId;

  @Prop({ type: Boolean, required: true, default: true })
  incluida!: boolean;
}

export const ExperienciaEvidenciaSchema =
  SchemaFactory.createForClass(ExperienciaEvidencia);
ExperienciaEvidenciaSchema.index(
  { id_experiencia: 1, id_evidencia: 1 },
  { unique: true },
);
