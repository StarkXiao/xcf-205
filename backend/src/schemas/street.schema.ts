import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StreetDocument = Street & Document;

@Schema({ timestamps: true })
export class Street {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ type: Number })
  lng: number;

  @Prop({ type: Number })
  lat: number;

  @Prop({ type: [[Number]], default: [] })
  boundary: number[][];

  @Prop({ type: Number, default: 0 })
  sort: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  remark: string;
}

export const StreetSchema = SchemaFactory.createForClass(Street);

StreetSchema.index({ code: 1 }, { unique: true });
