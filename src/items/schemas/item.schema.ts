import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { FORMATO_ITEM } from '../../common/enums.js';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ItemDocument = HydratedDocument<Item>;

@Schema({ collection: 'items', versionKey: false })
export class Item {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ExperienciaEvidencia',
    required: true,
  })
  id_experiencia_evidencia!: Types.ObjectId;

  @Prop({ type: String, required: true })
  enunciado!: string;

  @Prop({ type: String, required: true, enum: FORMATO_ITEM })
  formato!: (typeof FORMATO_ITEM)[number];

  @Prop({ type: String, required: true, maxlength: 30, trim: true })
  origen!: string;

  @Prop({ type: String, required: true, maxlength: 30, trim: true })
  estado_revision!: string;

  @Prop({ type: Boolean, required: true, default: false })
  excluido!: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
