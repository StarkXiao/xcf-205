import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WorkOrder, WorkOrderDocument, WorkOrderStatus } from '../schemas/workorder.schema';
import { WorkOrderLog, WorkOrderLogDocument } from '../schemas/workorder-log.schema';
import { Event, EventStatus } from '../schemas/event.schema';

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectModel(WorkOrder.name) private workOrderModel: Model<WorkOrderDocument>,
    @InjectModel(WorkOrderLog.name) private workOrderLogModel: Model<WorkOrderLogDocument>,
    @InjectModel(Event.name) private eventModel: Model<any>,
  ) {}

  generateOrderNo() {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `WO${dateStr}${random}`;
  }

  async findAll(query: any = {}) {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword, 
      status, 
      priority,
      handlerId,
      department,
      startDate,
      endDate,
    } = query;
    
    const filter: any = {};
    
    if (keyword) {
      filter.$or = [
        { orderNo: { $regex: keyword, $options: 'i' } },
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (handlerId) filter.handlerId = handlerId;
    if (department) filter.department = department;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const workOrders = await this.workOrderModel
      .find(filter)
      .populate('eventId')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1, priority: -1 });

    const total = await this.workOrderModel.countDocuments(filter);

    return {
      list: workOrders,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async findOne(id: string) {
    const workOrder = await this.workOrderModel
      .findById(id)
      .populate('eventId')
      .populate('logs');
    
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    return workOrder;
  }

  async create(data: any) {
    const orderNo = this.generateOrderNo();
    
    const workOrder = new this.workOrderModel({
      ...data,
      orderNo,
      status: WorkOrderStatus.PENDING,
    });
    
    await workOrder.save();
    
    await this.addLog(workOrder._id, {
      action: '创建工单',
      description: '工单已创建',
      operatorId: data.assignerId,
      operatorName: data.assignerName,
    });

    if (data.eventId) {
      await this.eventModel.findByIdAndUpdate(data.eventId, {
        status: EventStatus.PROCESSING,
      });
    }

    return workOrder.populate('eventId');
  }

  async update(id: string, data: any) {
    const workOrder = await this.workOrderModel.findByIdAndUpdate(id, data, { new: true });
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    return workOrder;
  }

  async remove(id: string) {
    const workOrder = await this.workOrderModel.findByIdAndDelete(id);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }
    return { message: '删除成功' };
  }

  async assign(id: string, data: { handlerId: string; handlerName: string; department?: string; assignerId: string; assignerName: string }) {
    const workOrder = await this.workOrderModel.findById(id);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const oldData = {
      handlerId: workOrder.handlerId,
      handlerName: workOrder.handlerName,
      status: workOrder.status,
    };

    workOrder.handlerId = new Types.ObjectId(data.handlerId) as any;
    workOrder.handlerName = data.handlerName;
    workOrder.department = data.department || workOrder.department;
    workOrder.status = WorkOrderStatus.ASSIGNED;
    workOrder.assignerId = new Types.ObjectId(data.assignerId) as any;
    workOrder.assignerName = data.assignerName;
    
    await workOrder.save();

    await this.addLog(id, {
      action: '派单',
      description: `工单已指派给 ${data.handlerName}`,
      operatorId: data.assignerId,
      operatorName: data.assignerName,
      from: oldData,
      to: {
        handlerId: data.handlerId,
        handlerName: data.handlerName,
        status: WorkOrderStatus.ASSIGNED,
      },
    });

    return workOrder;
  }

  async startProcessing(id: string, data: { handlerId: string; handlerName: string }) {
    const workOrder = await this.workOrderModel.findById(id);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const oldStatus = workOrder.status;
    workOrder.status = WorkOrderStatus.PROCESSING;
    await workOrder.save();

    await this.addLog(id, {
      action: '开始处理',
      description: '工作人员开始处理工单',
      operatorId: data.handlerId,
      operatorName: data.handlerName,
      from: { status: oldStatus },
      to: { status: WorkOrderStatus.PROCESSING },
    });

    return workOrder;
  }

  async complete(id: string, data: { 
    handlerId: string; 
    handlerName: string; 
    handleResult: string; 
    handleImages?: string[] 
  }) {
    const workOrder = await this.workOrderModel.findById(id);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const oldStatus = workOrder.status;
    workOrder.status = WorkOrderStatus.COMPLETED;
    workOrder.handleResult = data.handleResult;
    workOrder.handleImages = data.handleImages || [];
    workOrder.handleTime = new Date();
    await workOrder.save();

    await this.addLog(id, {
      action: '处理完成',
      description: data.handleResult,
      operatorId: data.handlerId,
      operatorName: data.handlerName,
      from: { status: oldStatus },
      to: { status: WorkOrderStatus.COMPLETED },
    });

    return workOrder;
  }

  async verify(id: string, data: { 
    verifierId: string; 
    verifierName: string; 
    verifyResult: string; 
    verifyRemark?: string 
  }) {
    const workOrder = await this.workOrderModel.findById(id);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const oldStatus = workOrder.status;
    
    if (data.verifyResult === 'pass') {
      workOrder.status = WorkOrderStatus.VERIFIED;
      
      if (workOrder.eventId) {
        await this.eventModel.findByIdAndUpdate(workOrder.eventId, {
          status: EventStatus.RESOLVED,
        });
      }
    } else {
      workOrder.status = WorkOrderStatus.PROCESSING;
    }
    
    workOrder.verifyTime = new Date();
    workOrder.verifyRemark = data.verifyRemark;
    await workOrder.save();

    await this.addLog(id, {
      action: '核查' + (data.verifyResult === 'pass' ? '通过' : '不通过'),
      description: data.verifyRemark || '',
      operatorId: data.verifierId,
      operatorName: data.verifierName,
      from: { status: oldStatus },
      to: { status: workOrder.status },
    });

    return workOrder;
  }

  async close(id: string, data: { operatorId: string; operatorName: string; reason?: string }) {
    const workOrder = await this.workOrderModel.findById(id);
    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const oldStatus = workOrder.status;
    workOrder.status = WorkOrderStatus.CLOSED;
    await workOrder.save();

    if (workOrder.eventId) {
      await this.eventModel.findByIdAndUpdate(workOrder.eventId, {
        status: EventStatus.CLOSED,
      });
    }

    await this.addLog(id, {
      action: '关闭工单',
      description: data.reason || '工单已关闭',
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      from: { status: oldStatus },
      to: { status: WorkOrderStatus.CLOSED },
    });

    return workOrder;
  }

  async addLog(workOrderId: string | Types.ObjectId, logData: any) {
    const log = new this.workOrderLogModel({
      workOrderId: new Types.ObjectId(workOrderId as string),
      ...logData,
    });
    await log.save();

    await this.workOrderModel.findByIdAndUpdate(workOrderId, {
      $push: { logs: log._id },
    });

    return log;
  }

  async getLogs(workOrderId: string) {
    return this.workOrderLogModel
      .find({ workOrderId })
      .sort({ createdAt: 1 });
  }

  async getStatistics() {
    const total = await this.workOrderModel.countDocuments();
    
    const statusStats = await this.workOrderModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    
    const priorityStats = await this.workOrderModel.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.workOrderModel.countDocuments({ createdAt: { $gte: today } });

    const completedToday = await this.workOrderModel.countDocuments({
      handleTime: { $gte: today },
      status: WorkOrderStatus.COMPLETED,
    });

    return {
      total,
      todayCount,
      completedToday,
      statusStats,
      priorityStats,
    };
  }

  async getDepartmentStats() {
    const result = await this.workOrderModel.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return result.map(item => ({
      department: item._id || '未分配',
      total: item.count,
      completed: item.completed,
    }));
  }

  async getTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const result = await this.workOrderModel.aggregate([
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

    return result.map(item => ({
      date: item._id,
      count: item.count,
      completed: item.completed,
    }));
  }
}
