import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommunityDocument = Community & Document;

@Schema({ timestamps: true })
export class Community {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Street', required: true })
  streetId: Types.ObjectId;

  @Prop()
  streetName: string;

  @Prop()
  streetCode: string;

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

export const CommunitySchema = SchemaFactory.createForClass(Community);

CommunitySchema.index({ code: 1 }, { unique: true });
CommunitySchema.index({ streetId: 1 });
