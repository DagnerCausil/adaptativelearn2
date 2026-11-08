import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DocenteDocument = HydratedDocument<Docente>;

@Schema({ collection: 'docentes', versionKey: false })
export class Docente {
  @Prop({ type: String, required: true, maxlength: 120, trim: true })
  nombre!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    maxlength: 160,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  })
  correo!: string;

  @Prop({
    type: String,
    maxlength: 255,
    trim: true,
    match: /^https?:\/\/\S+$/,
  })
  avatar_url?: string;
}

export const DocenteSchema = SchemaFactory.createForClass(Docente);
