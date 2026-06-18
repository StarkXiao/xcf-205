import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventDocument = Event & Document;

export enum EventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ default: 'medium' })
  priority: string;

  @Prop({ type: String, enum: EventStatus, default: EventStatus.PENDING })
  status: EventStatus;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  location: string;

  @Prop()
  address: string;

  @Prop({ type: Number })
  lng: number;

  @Prop({ type: Number })
  lat: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reporterId: Types.ObjectId;

  @Prop()
  reporterName: string;

  @Prop()
  reporterPhone: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  handlerId: Types.ObjectId;

  @Prop()
  handlerName: string;

  @Prop()
  source: string;

  @Prop()
  remark: string;

  @Prop({ type: Types.ObjectId, ref: 'InspectionException' })
  inspectionExceptionId: Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);
