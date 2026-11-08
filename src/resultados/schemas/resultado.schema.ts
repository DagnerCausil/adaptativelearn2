import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ESTADO_RESULTADO } from '../../common/enums.js';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ResultadoDocument = HydratedDocument<Resultado>;

@Schema({ collection: 'resultados', versionKey: false })
export class Resultado {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Inscripcion',
    required: true,
  })
  id_inscripcion!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ExperienciaEvidencia',
    required: true,
  })
  id_experiencia_evidencia!: Types.ObjectId;

  @Prop({ type: String, required: true, enum: ESTADO_RESULTADO })
  estado!: (typeof ESTADO_RESULTADO)[number];

  @Prop({ type: Date, required: true, default: Date.now })
  fecha_calculo!: Date;
}

export const ResultadoSchema = SchemaFactory.createForClass(Resultado);
ResultadoSchema.index(
  { id_inscripcion: 1, id_experiencia_evidencia: 1 },
  { unique: true },
);
