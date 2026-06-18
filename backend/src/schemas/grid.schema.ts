import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GridDocument = Grid & Document;

@Schema({ timestamps: true })
export class Grid {
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

  @Prop({ type: Types.ObjectId, ref: 'Community', required: true })
  communityId: Types.ObjectId;

  @Prop()
  communityName: string;

  @Prop()
  communityCode: string;

  @Prop()
  description: string;

  @Prop({ type: Number })
  lng: number;

  @Prop({ type: Number })
  lat: number;

  @Prop({ type: [[Number]], default: [] })
  boundary: number[][];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  gridLeaderId: Types.ObjectId;

  @Prop()
  gridLeaderName: string;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  gridMemberIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  gridMemberNames: string[];

  @Prop({ type: Number, default: 0 })
  sort: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  remark: string;
}

export const GridSchema = SchemaFactory.createForClass(Grid);

GridSchema.index({ code: 1 }, { unique: true });
GridSchema.index({ streetId: 1 });
GridSchema.index({ communityId: 1 });
