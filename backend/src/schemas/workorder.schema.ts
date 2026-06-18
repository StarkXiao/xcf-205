import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkOrderDocument = WorkOrder & Document;

export enum WorkOrderStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  VERIFIED = 'verified',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class WorkOrder {
  @Prop({ required: true, unique: true })
  orderNo: string;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ default: 'medium' })
  priority: string;

  @Prop({ type: String, enum: WorkOrderStatus, default: WorkOrderStatus.PENDING })
  status: WorkOrderStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignerId: Types.ObjectId;

  @Prop()
  assignerName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  handlerId: Types.ObjectId;

  @Prop()
  handlerName: string;

  @Prop()
  department: string;

  @Prop()
  deadline: Date;

  @Prop()
  handleResult: string;

  @Prop({ type: [String], default: [] })
  handleImages: string[];

  @Prop({ type: Date })
  handleTime: Date;

  @Prop({ type: Date })
  verifyTime: Date;

  @Prop()
  verifyResult: string;

  @Prop()
  verifyRemark: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'WorkOrderLog' }], default: [] })
  logs: Types.ObjectId[];
}

export const WorkOrderSchema = SchemaFactory.createForClass(WorkOrder);
