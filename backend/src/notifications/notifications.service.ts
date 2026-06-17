import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
} from '../schemas/notification.schema';

export interface CreateNotificationDto {
  userId: string | Types.ObjectId;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
  relatedType?: string;
  senderId?: string | Types.ObjectId;
  senderName?: string;
  priority?: NotificationPriority;
  extra?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      ...dto,
      userId: new Types.ObjectId(dto.userId as string),
      senderId: dto.senderId ? new Types.ObjectId(dto.senderId as string) : undefined,
      status: NotificationStatus.UNREAD,
    });
    await notification.save();
    return notification;
  }

  async createMany(dtos: CreateNotificationDto[]): Promise<NotificationDocument[]> {
    const notifications = dtos.map((dto) => ({
      ...dto,
      userId: new Types.ObjectId(dto.userId as string),
      senderId: dto.senderId ? new Types.ObjectId(dto.senderId as string) : undefined,
      status: NotificationStatus.UNREAD,
    }));
    return this.notificationModel.create(notifications);
  }

  async findAll(
    userId: string | Types.ObjectId,
    query: any = {},
  ): Promise<{ list: NotificationDocument[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 20, type, status } = query;

    const filter: any = {
      userId: new Types.ObjectId(userId as string),
    };

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const list = await this.notificationModel
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1, priority: -1 });

    const total = await this.notificationModel.countDocuments(filter);

    return {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async findOne(id: string, userId: string | Types.ObjectId): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOne({
      _id: id,
      userId: new Types.ObjectId(userId as string),
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string | Types.ObjectId): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOneAndUpdate(
      { _id: id, userId: new Types.ObjectId(userId as string) },
      { status: NotificationStatus.READ, readAt: new Date() },
      { new: true },
    );

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    return notification;
  }

  async markAllAsRead(
    userId: string | Types.ObjectId,
    type?: NotificationType,
  ): Promise<{ updated: number }> {
    const filter: any = {
      userId: new Types.ObjectId(userId as string),
      status: NotificationStatus.UNREAD,
    };

    if (type) {
      filter.type = type;
    }

    const result = await this.notificationModel.updateMany(filter, {
      status: NotificationStatus.READ,
      readAt: new Date(),
    });

    return { updated: result.modifiedCount };
  }

  async remove(id: string, userId: string | Types.ObjectId): Promise<{ message: string }> {
    const result = await this.notificationModel.findOneAndDelete({
      _id: id,
      userId: new Types.ObjectId(userId as string),
    });

    if (!result) {
      throw new NotFoundException('通知不存在');
    }

    return { message: '删除成功' };
  }

  async clearAll(
    userId: string | Types.ObjectId,
    type?: NotificationType,
  ): Promise<{ deleted: number }> {
    const filter: any = {
      userId: new Types.ObjectId(userId as string),
    };

    if (type) {
      filter.type = type;
    }

    const result = await this.notificationModel.deleteMany(filter);
    return { deleted: result.deletedCount };
  }

  async getStats(userId: string | Types.ObjectId): Promise<{
    total: number;
    unread: number;
    byType: {
      system: number;
      todo: number;
      reminder: number;
      approval: number;
    };
  }> {
    const userIdObj = new Types.ObjectId(userId as string);

    const [total, unread, byTypeResult] = await Promise.all([
      this.notificationModel.countDocuments({ userId: userIdObj }),
      this.notificationModel.countDocuments({ userId: userIdObj, status: NotificationStatus.UNREAD }),
      this.notificationModel.aggregate([
        { $match: { userId: userIdObj } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
    ]);

    const byType = {
      system: 0,
      todo: 0,
      reminder: 0,
      approval: 0,
    };

    byTypeResult.forEach((item) => {
      if (item._id in byType) {
        byType[item._id as keyof typeof byType] = item.count;
      }
    });

    return {
      total,
      unread,
      byType,
    };
  }
}
