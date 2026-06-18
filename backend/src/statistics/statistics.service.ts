import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from '../schemas/event.schema';
import { WorkOrder, WorkOrderStatus } from '../schemas/workorder.schema';
import { User } from '../schemas/user.schema';
import { DictionariesService } from '../dictionaries/dictionaries.service';
import { DictionaryType } from '../schemas/dictionary.schema';
import { RegionsService } from '../regions/regions.service';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<any>,
    @InjectModel(WorkOrder.name) private workOrderModel: Model<any>,
    @InjectModel(User.name) private userModel: Model<any>,
    private readonly dictionariesService: DictionariesService,
    private readonly regionsService: RegionsService,
  ) {}

  async getOverview() {
    const totalEvents = await this.eventModel.countDocuments();
    const totalWorkOrders = await this.workOrderModel.countDocuments();
    const totalUsers = await this.userModel.countDocuments();
    
    const pendingEvents = await this.eventModel.countDocuments({ status: EventStatus.PENDING });
    const processingEvents = await this.eventModel.countDocuments({ status: EventStatus.PROCESSING });
    const resolvedEvents = await this.eventModel.countDocuments({ status: EventStatus.RESOLVED });

    const pendingWorkOrders = await this.workOrderModel.countDocuments({ status: WorkOrderStatus.PENDING });
    const processingWorkOrders = await this.workOrderModel.countDocuments({ status: WorkOrderStatus.PROCESSING });
    const completedWorkOrders = await this.workOrderModel.countDocuments({ status: WorkOrderStatus.COMPLETED });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayEvents = await this.eventModel.countDocuments({ createdAt: { $gte: today } });
    const todayWorkOrders = await this.workOrderModel.countDocuments({ createdAt: { $gte: today } });

    const eventResolveRate = totalEvents > 0 ? Math.round((resolvedEvents / totalEvents) * 100) : 0;
    const workOrderCompleteRate = totalWorkOrders > 0 ? Math.round((completedWorkOrders / totalWorkOrders) * 100) : 0;

    return {
      events: {
        total: totalEvents,
        today: todayEvents,
        pending: pendingEvents,
        processing: processingEvents,
        resolved: resolvedEvents,
        resolveRate: eventResolveRate,
      },
      workOrders: {
        total: totalWorkOrders,
        today: todayWorkOrders,
        pending: pendingWorkOrders,
        processing: processingWorkOrders,
        completed: completedWorkOrders,
        completeRate: workOrderCompleteRate,
      },
      users: {
        total: totalUsers,
      },
    };
  }

  async getEventCategoryStats() {
    const result = await this.eventModel.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const categoryMap = await this.dictionariesService.getDictionaryMap(DictionaryType.EVENT_CATEGORY);

    return result.map(item => ({
      category: item._id,
      categoryName: categoryMap[item._id] || item._id,
      count: item.count,
      resolved: item.resolved,
      rate: item.count > 0 ? Math.round((item.resolved / item.count) * 100) : 0,
    }));
  }

  async getEventStatusStats() {
    const result = await this.eventModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap: Record<string, string> = {
      pending: '待处理',
      processing: '处理中',
      resolved: '已解决',
      closed: '已关闭',
    };

    return result.map(item => ({
      status: item._id,
      statusName: statusMap[item._id] || item._id,
      count: item.count,
    }));
  }

  async getWorkOrderStatusStats() {
    const result = await this.workOrderModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const statusMap: Record<string, string> = {
      pending: '待分派',
      assigned: '已分派',
      processing: '处理中',
      completed: '已完成',
      verified: '已核查',
      closed: '已关闭',
    };

    return result.map(item => ({
      status: item._id,
      statusName: statusMap[item._id] || item._id,
      count: item.count,
    }));
  }

  async getTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const eventResult = await this.eventModel.aggregate([
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

    const workOrderResult = await this.workOrderModel.aggregate([
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
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const eventMap = new Map(eventResult.map(item => [item._id, item.count]));
    const workOrderMap = new Map(workOrderResult.map(item => [item._id, { count: item.count, completed: item.completed }]));

    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dates.push(dateStr);
    }

    return dates.map(date => ({
      date,
      events: eventMap.get(date) || 0,
      workOrders: workOrderMap.get(date)?.count || 0,
      completed: workOrderMap.get(date)?.completed || 0,
    }));
  }

  async getDepartmentStats() {
    const result = await this.workOrderModel.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', ['completed', 'verified', 'closed']] }, 1, 0],
            },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $in: ['$status', ['assigned', 'processing']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const departmentMap = await this.dictionariesService.getDictionaryMap(DictionaryType.DEPARTMENT);

    return result.map(item => ({
      department: item._id || '未分配',
      departmentName: item._id ? (departmentMap[item._id] || item._id) : '未分配',
      total: item.total,
      completed: item.completed,
      pending: item.pending,
      processing: item.processing,
      rate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
    }));
  }

  async getPriorityStats() {
    const eventResult = await this.eventModel.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const workOrderResult = await this.workOrderModel.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]);

    const priorityItems = await this.dictionariesService.findByType(DictionaryType.EVENT_PRIORITY);
    const priorityMap: Record<string, string> = {};
    const priorityOrder: string[] = [];
    priorityItems.forEach(item => {
      priorityMap[item.code] = item.name;
      priorityOrder.push(item.code);
    });

    const eventPriorityMap = new Map(eventResult.map(item => [item._id, item.count]));
    const workOrderPriorityMap = new Map(workOrderResult.map(item => [item._id, item.count]));

    const priorities = priorityOrder.length > 0 ? priorityOrder : ['low', 'medium', 'high', 'urgent'];

    return priorities.map(priority => ({
      priority,
      priorityName: priorityMap[priority] || priority,
      events: eventPriorityMap.get(priority) || 0,
      workOrders: workOrderPriorityMap.get(priority) || 0,
    }));
  }

  async getHandlerRanking() {
    const result = await this.workOrderModel.aggregate([
      {
        $match: {
          handlerName: { $exists: true, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$handlerName',
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $in: ['$status', ['completed', 'verified', 'closed']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { completed: -1, total: -1 } },
      { $limit: 10 },
    ]);

    return result.map(item => ({
      handlerName: item._id,
      total: item.total,
      completed: item.completed,
      rate: item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0,
    }));
  }

  async getEventByStreet() {
    const result = await this.eventModel.aggregate([
      {
        $match: {
          streetId: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: '$streetId',
          streetName: { $first: '$streetName' },
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ['$status', 'processing'] }, 1, 0],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
            },
          },
          closed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'closed'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return result.map(item => ({
      streetId: item._id,
      streetName: item.streetName || '未分配',
      total: item.total,
      pending: item.pending,
      processing: item.processing,
      resolved: item.resolved,
      closed: item.closed,
      resolveRate: item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0,
    }));
  }

  async getEventByCommunity(streetId?: string) {
    const match: any = {
      communityId: { $exists: true, $ne: null },
    };
    if (streetId) {
      match.streetId = streetId;
    }

    const result = await this.eventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$communityId',
          communityName: { $first: '$communityName' },
          streetName: { $first: '$streetName' },
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ['$status', 'processing'] }, 1, 0],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return result.map(item => ({
      communityId: item._id,
      communityName: item.communityName || '未分配',
      streetName: item.streetName || '',
      total: item.total,
      pending: item.pending,
      processing: item.processing,
      resolved: item.resolved,
      resolveRate: item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0,
    }));
  }

  async getEventByGrid(communityId?: string) {
    const match: any = {
      gridId: { $exists: true, $ne: null },
    };
    if (communityId) {
      match.communityId = communityId;
    }

    const result = await this.eventModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$gridId',
          gridName: { $first: '$gridName' },
          communityName: { $first: '$communityName' },
          streetName: { $first: '$streetName' },
          total: { $sum: 1 },
          pending: {
            $sum: {
              $cond: [{ $eq: ['$status', 'pending'] }, 1, 0],
            },
          },
          processing: {
            $sum: {
              $cond: [{ $eq: ['$status', 'processing'] }, 1, 0],
            },
          },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return result.map(item => ({
      gridId: item._id,
      gridName: item.gridName || '未分配',
      communityName: item.communityName || '',
      streetName: item.streetName || '',
      total: item.total,
      pending: item.pending,
      processing: item.processing,
      resolved: item.resolved,
      resolveRate: item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0,
    }));
  }
}
