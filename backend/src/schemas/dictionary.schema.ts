import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type DictionaryDocument = Dictionary & Document;

export enum DictionaryType {
  EVENT_CATEGORY = 'event_category',
  EVENT_PRIORITY = 'event_priority',
  DEPARTMENT = 'department',
  SOURCE_CHANNEL = 'source_channel',
}

@Schema({ timestamps: true })
export class Dictionary {
  @Prop({ type: String, enum: DictionaryType, required: true })
  type: DictionaryType;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Number, default: 0 })
  sort: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  color: string;

  @Prop()
  remark: string;
}

export const DictionarySchema = SchemaFactory.createForClass(Dictionary);

DictionarySchema.index({ type: 1, code: 1 }, { unique: true });
