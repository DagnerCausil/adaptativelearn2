import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type PresentacionDocument = HydratedDocument<Presentacion>;

@Schema({ collection: 'presentaciones', versionKey: false })
export class Presentacion {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Inscripcion',
    required: true,
  })
  id_inscripcion!: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Item', required: true })
  id_item!: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
    validate: Number.isInteger,
  })
  orden_presentacion!: number;

  @Prop({ type: Date, required: true, default: Date.now })
  fecha_presentacion!: Date;
}

export const PresentacionSchema = SchemaFactory.createForClass(Presentacion);
PresentacionSchema.index(
  { id_inscripcion: 1, id_item: 1 },
  { unique: true },
);
