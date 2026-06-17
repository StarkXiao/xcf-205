import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ApprovalFlowDocument = ApprovalFlow & Document;

export enum ApprovalFlowType {
  EXTENSION = 'extension',
  REASSIGN = 'reassign',
  CLOSE_REJECT = 'close_reject',
}

export enum ApprovalNodeType {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  END = 'end',
}

export enum ApproverType {
  ROLE = 'role',
  DEPARTMENT_HEAD = 'department_head',
  SPECIFIC = 'specific',
}

@Schema({ timestamps: true, collection: 'approval-flows' })
export class ApprovalFlowNode {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ApprovalNodeType, required: true })
  type: ApprovalNodeType;

  @Prop({ type: String, enum: ApproverType })
  approverType: ApproverType;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  approverIds: Types.ObjectId[];

  @Prop()
  roleCode: string;

  @Prop({ type: Number, default: 0 })
  order: number;
}

@Schema({ timestamps: true, collection: 'approval-flows' })
export class ApprovalFlow {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, enum: ApprovalFlowType, required: true, unique: true })
  type: ApprovalFlowType;

  @Prop({ type: [ApprovalFlowNode], default: [] })
  nodes: ApprovalFlowNode[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop()
  createdByName: string;

  @Prop()
  description: string;
}

export const ApprovalFlowSchema = SchemaFactory.createForClass(ApprovalFlow);

ApprovalFlowSchema.index({ type: 1 });
ApprovalFlowSchema.index({ isActive: 1 });
