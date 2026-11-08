import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DbaDocument = HydratedDocument<Dba>;

@Schema({ collection: 'dbas', versionKey: false })
export class Dba {
  @Prop({ type: String, required: true, unique: true, maxlength: 20, trim: true })
  codigo!: string;

  @Prop({ type: String, required: true, maxlength: 60, trim: true })
  area!: string;

  @Prop({ type: Number, required: true, validate: Number.isInteger })
  grado!: number;

  @Prop({ type: String, required: true })
  enunciado!: string;

  @Prop({ type: String })
  ejemplo?: string;
}

export const DbaSchema = SchemaFactory.createForClass(Dba);
