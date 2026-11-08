import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type InscripcionDocument = HydratedDocument<Inscripcion>;

@Schema({ collection: 'inscripciones', versionKey: false })
export class Inscripcion {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Estudiante',
    required: true,
  })
  id_estudiante!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Experiencia',
    required: true,
  })
  id_experiencia!: Types.ObjectId;

  @Prop({ type: Date, required: true, default: Date.now })
  fecha_union!: Date;
}

export const InscripcionSchema = SchemaFactory.createForClass(Inscripcion);
InscripcionSchema.index(
  { id_estudiante: 1, id_experiencia: 1 },
  { unique: true },
);
