import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type DictamenEvidenciaDocument = HydratedDocument<DictamenEvidencia>;

@Schema({ collection: 'dictamenes_evidencia', versionKey: false })
export class DictamenEvidencia {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'Evidencia',
  })
  id_evidencia!: Types.ObjectId;

  @Prop({ type: Boolean, required: true })
  aplica_formato_cerrado!: boolean;

  @Prop({ type: String })
  justificacion?: string;

  @Prop({ type: Date, required: true })
  fecha_dictamen!: Date;
}

export const DictamenEvidenciaSchema = SchemaFactory.createForClass(DictamenEvidencia);
