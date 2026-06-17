import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  realName: string;

  @Prop()
  phone: string;

  @Prop({ type: Types.ObjectId, ref: 'Role', required: true })
  roleId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  department: string;

  @Prop()
  avatar: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
