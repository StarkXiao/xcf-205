import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventDocument, EventStatus, EventCategory } from '../schemas/event.schema';

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  async findAll(query: any = {}) {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword, 
      status, 
      category, 
      priority,
      startDate,
      endDate,
    } = query;
    
    const filter: any = {};
    
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { address: { $regex: keyword, $options: 'i' } },
        { reporterName: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const events = await this.eventModel
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1, priority: -1 });

    const total = await this.eventModel.countDocuments(filter);

    return {
      list: events,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async findAllForMap(query: any = {}) {
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    
    const events = await this.eventModel
      .find(filter)
      .select('title category status lng lat address priority createdAt');
    
    return events.filter(e => e.lng && e.lat);
  }

  async findOne(id: string) {
    const event = await this.eventModel.findById(id);
    if (!event) {
      throw new NotFoundException('事件不存在');
    }
    return event;
  }

  async create(data: any) {
    const event = new this.eventModel(data);
    return event.save();
  }

  async update(id: string, data: any) {
    const event = await this.eventModel.findByIdAndUpdate(id, data, { new: true });
    if (!event) {
      throw new NotFoundException('事件不存在');
    }
    return event;
  }

  async remove(id: string) {
    const event = await this.eventModel.findByIdAndDelete(id);
    if (!event) {
      throw new NotFoundException('事件不存在');
    }
    return { message: '删除成功' };
  }

  async updateStatus(id: string, status: EventStatus, handlerId?: string, handlerName?: string) {
    const updateData: any = { status };
    if (handlerId) updateData.handlerId = handlerId;
    if (handlerName) updateData.handlerName = handlerName;
    
    const event = await this.eventModel.findByIdAndUpdate(id, updateData, { new: true });
    if (!event) {
      throw new NotFoundException('事件不存在');
    }
    return event;
  }

  async getStatistics() {
    const total = await this.eventModel.countDocuments();
    
    const statusStats = await this.eventModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    
    const categoryStats = await this.eventModel.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    
    const priorityStats = await this.eventModel.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.eventModel.countDocuments({ createdAt: { $gte: today } });

    return {
      total,
      todayCount,
      statusStats,
      categoryStats,
      priorityStats,
    };
  }

  async getTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return result.map(item => ({
      date: item._id,
      count: item.count,
    }));
  }
}
