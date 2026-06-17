import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApprovalFlowType } from './approval-flow.schema';

export type ApprovalInstanceDocument = ApprovalInstance & Document;

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum NodeInstanceStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true, collection: 'approval-node-instances' })
export class ApprovalNodeInstance {
  @Prop({ required: true })
  nodeName: string;

  @Prop({ required: true })
  nodeType: string;

  @Prop({ type: Number, required: true })
  nodeIndex: number;

  @Prop({ type: String, enum: NodeInstanceStatus, default: NodeInstanceStatus.PENDING })
  status: NodeInstanceStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approverId: Types.ObjectId;

  @Prop()
  approverName: string;

  @Prop()
  comment: string;

  @Prop({ type: Date })
  operateTime: Date;
}

@Schema({ timestamps: true, collection: 'approval-instances' })
export class ApprovalInstance {
  @Prop({ type: Types.ObjectId, ref: 'ApprovalFlow', required: true })
  flowId: Types.ObjectId;

  @Prop({ required: true })
  flowName: string;

  @Prop({ type: String, enum: ApprovalFlowType, required: true })
  type: ApprovalFlowType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: String, enum: ApprovalStatus, default: ApprovalStatus.PENDING })
  status: ApprovalStatus;

  @Prop({ type: Types.ObjectId, ref: 'WorkOrder' })
  relatedId: Types.ObjectId;

  @Prop({ default: 'workorder' })
  relatedType: string;

  @Prop()
  relatedNo: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  applicantId: Types.ObjectId;

  @Prop({ required: true })
  applicantName: string;

  @Prop({ type: Number, default: 0 })
  currentNodeIndex: number;

  @Prop({ type: [ApprovalNodeInstance], default: [] })
  nodeInstances: ApprovalNodeInstance[];

  @Prop({ type: Object, default: {} })
  extraData: Record<string, any>;
}

export const ApprovalInstanceSchema = SchemaFactory.createForClass(ApprovalInstance);

ApprovalInstanceSchema.index({ type: 1, status: 1 });
ApprovalInstanceSchema.index({ applicantId: 1, status: 1 });
ApprovalInstanceSchema.index({ relatedId: 1 });
