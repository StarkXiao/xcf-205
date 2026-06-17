import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AttachmentDocument = Attachment & Document;

export enum AttachmentType {
  EVENT_IMAGE = 'event_image',
  WORKORDER_IMAGE = 'workorder_image',
  INSPECTION_MATERIAL = 'inspection_material',
  OTHER = 'other',
}

export enum AttachmentStatus {
  NORMAL = 'normal',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

@Schema({ timestamps: true, collection: 'attachments' })
export class Attachment {
  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ type: String, enum: AttachmentType, required: true })
  type: AttachmentType;

  @Prop({ type: String, enum: AttachmentStatus, default: AttachmentStatus.NORMAL })
  status: AttachmentStatus;

  @Prop({ type: Types.ObjectId, refPath: 'relatedModel' })
  relatedId: Types.ObjectId;

  @Prop()
  relatedModel: string;

  @Prop()
  relatedNo: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy: Types.ObjectId;

  @Prop()
  uploadedByName: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  archivedBy: Types.ObjectId;

  @Prop()
  archivedByName: string;

  @Prop({ type: Date })
  archivedAt: Date;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);
