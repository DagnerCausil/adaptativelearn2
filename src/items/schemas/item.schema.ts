import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  ESTADO_REVISION_ITEM,
  FORMATO_ITEM,
  ORIGEN_ITEM,
} from '../../common/enums.js';
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

  @Prop({ type: String, required: true, enum: ORIGEN_ITEM })
  origen!: (typeof ORIGEN_ITEM)[number];

  @Prop({
    type: String,
    required: true,
    enum: ESTADO_REVISION_ITEM,
    default: 'borrador',
  })
  estado_revision!: (typeof ESTADO_REVISION_ITEM)[number];

  @Prop({ type: Boolean, required: true, default: false })
  excluido!: boolean;
}

export const ItemSchema = SchemaFactory.createForClass(Item);
