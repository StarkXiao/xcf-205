import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type KnowledgeDocument = Knowledge & Document;

export enum KnowledgeType {
  EVENT_CLASSIFICATION = 'event_classification',
  PROCESSING_SPEC = 'processing_spec',
  VERIFICATION_CRITERIA = 'verification_criteria',
}

@Schema({ timestamps: true })
export class Knowledge {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: KnowledgeType })
  type: KnowledgeType;

  @Prop({ required: true })
  content: string;

  @Prop()
  eventCategory: string;

  @Prop({ type: [Types.ObjectId], ref: 'Role', default: [] })
  visibleRoles: Types.ObjectId[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: 0 })
  referenceCount: number;

  @Prop({ default: '1.0' })
  version: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;
}

export const KnowledgeSchema = SchemaFactory.createForClass(Knowledge);
