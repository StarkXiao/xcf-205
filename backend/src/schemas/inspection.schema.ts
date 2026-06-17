import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type InspectionPlanDocument = InspectionPlan & Document;
export type InspectionTaskDocument = InspectionTask & Document;
export type InspectionExceptionDocument = InspectionException & Document;

export enum InspectionPlanStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InspectionPlanType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  TEMPORARY = 'temporary',
}

export enum InspectionTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  EXCEPTION = 'exception',
}

export enum CheckinStatus {
  NORMAL = 'normal',
  ABNORMAL = 'abnormal',
  SKIPPED = 'skipped',
}

export enum ExceptionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  CLOSED = 'closed',
}

@Schema({ _id: false })
export class Checkpoint {
  @Prop()
  _id?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: Number, required: true })
  lng: number;

  @Prop({ type: Number, required: true })
  lat: number;

  @Prop({ type: Number, required: true })
  order: number;

  @Prop({ type: Number, default: 100 })
  radius?: number;
}

@Schema({ _id: false })
export class CheckinRecord {
  @Prop({ type: Types.ObjectId })
  _id?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  checkpointId: Types.ObjectId;

  @Prop({ required: true })
  checkpointName: string;

  @Prop({ required: true })
  checkinTime: Date;

  @Prop({ type: Number, required: true })
  lng: number;

  @Prop({ type: Number, required: true })
  lat: number;

  @Prop({ type: String, enum: CheckinStatus, required: true })
  status: CheckinStatus;

  @Prop()
  remark?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];
}

@Schema({ timestamps: true, collection: 'inspection_plans' })
export class InspectionPlan {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: InspectionPlanType, required: true })
  type: InspectionPlanType;

  @Prop()
  frequency?: string;

  @Prop({ type: [Object], required: true, default: [] })
  checkpoints: Checkpoint[];

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true, default: [] })
  assigneeIds: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  assigneeNames: string[];

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ type: String, enum: InspectionPlanStatus, default: InspectionPlanStatus.DRAFT })
  status: InspectionPlanStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop()
  createdByName?: string;
}

@Schema({ timestamps: true, collection: 'inspection_tasks' })
export class InspectionTask {
  @Prop({ type: Types.ObjectId, ref: 'InspectionPlan', required: true })
  planId: Types.ObjectId;

  @Prop({ required: true })
  planName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assigneeId: Types.ObjectId;

  @Prop({ required: true })
  assigneeName: string;

  @Prop({ type: [Object], required: true, default: [] })
  checkpoints: Checkpoint[];

  @Prop({ type: [Object], default: [] })
  checkinRecords: CheckinRecord[];

  @Prop({ type: String, enum: InspectionTaskStatus, default: InspectionTaskStatus.PENDING })
  status: InspectionTaskStatus;

  @Prop({ required: true })
  scheduledDate: Date;

  @Prop()
  startTime?: string;

  @Prop()
  endTime?: string;

  @Prop()
  actualStartTime?: Date;

  @Prop()
  actualEndTime?: Date;

  @Prop({ type: Number, default: 0 })
  exceptionCount?: number;
}

@Schema({ timestamps: true, collection: 'inspection_exceptions' })
export class InspectionException {
  @Prop({ type: Types.ObjectId, ref: 'InspectionTask', required: true })
  taskId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'InspectionPlan' })
  planId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  checkpointId: Types.ObjectId;

  @Prop()
  checkpointName: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  reporterId: Types.ObjectId;

  @Prop({ required: true })
  reporterName: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  priority: string;

  @Prop({ required: true })
  address: string;

  @Prop({ type: Number })
  lng: number;

  @Prop({ type: Number })
  lat: number;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: Types.ObjectId, ref: 'Event' })
  eventId?: Types.ObjectId;

  @Prop({ type: String, enum: ExceptionStatus, default: ExceptionStatus.PENDING })
  status: ExceptionStatus;
}

export const InspectionPlanSchema = SchemaFactory.createForClass(InspectionPlan);
export const InspectionTaskSchema = SchemaFactory.createForClass(InspectionTask);
export const InspectionExceptionSchema = SchemaFactory.createForClass(InspectionException);
