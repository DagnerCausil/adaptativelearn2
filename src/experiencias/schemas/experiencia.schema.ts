import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ESTADO_EXPERIENCIA } from '../../common/enums.js';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ExperienciaDocument = HydratedDocument<Experiencia>;

@Schema({ collection: 'experiencias', versionKey: false })
export class Experiencia {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Docente', required: true })
  id_docente!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Dba', required: true })
  id_dba!: Types.ObjectId;

  @Prop({ type: String, required: true, maxlength: 150, trim: true })
  nombre!: string;

  @Prop({
    type: String,
    required: true,
    enum: ESTADO_EXPERIENCIA,
    default: 'borrador',
  })
  estado!: (typeof ESTADO_EXPERIENCIA)[number];

  @Prop({ type: Date, required: true, default: Date.now })
  fecha_creacion!: Date;

  @Prop({ type: Date })
  fecha_publicacion?: Date;

  @Prop({ type: String, required: true, unique: true, maxlength: 12, trim: true })
  codigo_invitacion!: string;
}

export const ExperienciaSchema = SchemaFactory.createForClass(Experiencia);
