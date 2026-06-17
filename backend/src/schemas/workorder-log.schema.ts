import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkOrderLogDocument = WorkOrderLog & Document;

@Schema({ timestamps: true })
export class WorkOrderLog {
  @Prop({ type: Types.ObjectId, ref: 'WorkOrder', required: true })
  workOrderId: Types.ObjectId;

  @Prop({ required: true })
  action: string;

  @Prop()
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  operatorId: Types.ObjectId;

  @Prop()
  operatorName: string;

  @Prop({ type: Object, default: {} })
  from: Record<string, any>;

  @Prop({ type: Object, default: {} })
  to: Record<string, any>;
}

export const WorkOrderLogSchema = SchemaFactory.createForClass(WorkOrderLog);
