import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApprovalLogDocument = ApprovalLog & Document;

@Schema({ timestamps: true, collection: 'approval-logs' })
export class ApprovalLog {
  @Prop({ type: Types.ObjectId, ref: 'ApprovalInstance', required: true })
  instanceId: Types.ObjectId;

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

export const ApprovalLogSchema = SchemaFactory.createForClass(ApprovalLog);

ApprovalLogSchema.index({ instanceId: 1, createdAt: 1 });
