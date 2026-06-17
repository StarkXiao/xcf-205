import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  code: string;

  @Prop()
  description: string;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
