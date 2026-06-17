import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  InspectionPlan,
  InspectionPlanDocument,
  InspectionTask,
  InspectionTaskDocument,
  InspectionException,
  InspectionExceptionDocument,
  InspectionPlanStatus,
  InspectionTaskStatus,
  CheckinStatus,
  ExceptionStatus,
  Checkpoint,
  CheckinRecord,
} from '../schemas/inspection.schema';
import { Event } from '../schemas/event.schema';

@Injectable()
export class InspectionsService {
  constructor(
    @InjectModel(InspectionPlan.name) private planModel: Model<InspectionPlanDocument>,
    @InjectModel(InspectionTask.name) private taskModel: Model<InspectionTaskDocument>,
    @InjectModel(InspectionException.name) private exceptionModel: Model<InspectionExceptionDocument>,
    @InjectModel(Event.name) private eventModel: Model<any>,
  ) {}

  async findAllPlans(query: any = {}) {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      status,
      type,
      startDate,
      endDate,
    } = query;

    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (type) filter.type = type;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const plans = await this.planModel
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const total = await this.planModel.countDocuments(filter);

    return {
      list: plans,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async findPlan(id: string) {
    const plan = await this.planModel.findById(id);
    if (!plan) {
      throw new NotFoundException('巡检计划不存在');
    }
    return plan;
  }

  async createPlan(data: any) {
    const checkpoints = (data.checkpoints || []).map((cp: Checkpoint, index: number) => ({
      ...cp,
      order: cp.order || index + 1,
      _id: cp._id || new Types.ObjectId().toString(),
    }));

    const assigneeIds = (data.assigneeIds || []).map((id: string) => new Types.ObjectId(id));

    const plan = new this.planModel({
      ...data,
      checkpoints,
      assigneeIds,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      createdBy: data.createdBy ? new Types.ObjectId(data.createdBy) : undefined,
    });

    const savedPlan = await plan.save();

    if (data.status === InspectionPlanStatus.ACTIVE) {
      await this.generateTasks(savedPlan);
    }

    return savedPlan;
  }

  async updatePlan(id: string, data: any) {
    const plan = await this.planModel.findById(id);
    if (!plan) {
      throw new NotFoundException('巡检计划不存在');
    }

    const updateData: any = { ...data };

    if (data.checkpoints) {
      updateData.checkpoints = data.checkpoints.map((cp: Checkpoint, index: number) => ({
        ...cp,
        order: cp.order || index + 1,
        _id: cp._id || new Types.ObjectId().toString(),
      }));
    }

    if (data.assigneeIds) {
      updateData.assigneeIds = data.assigneeIds.map((id: string) => new Types.ObjectId(id));
    }

    if (data.startDate) updateData.startDate = new Date(data.startDate);
    if (data.endDate) updateData.endDate = new Date(data.endDate);
    if (data.createdBy) updateData.createdBy = new Types.ObjectId(data.createdBy);

    const updatedPlan = await this.planModel.findByIdAndUpdate(id, updateData, { new: true });

    if (data.status === InspectionPlanStatus.ACTIVE && plan.status !== InspectionPlanStatus.ACTIVE) {
      await this.generateTasks(updatedPlan);
    }

    return updatedPlan;
  }

  async removePlan(id: string) {
    const plan = await this.planModel.findByIdAndDelete(id);
    if (!plan) {
      throw new NotFoundException('巡检计划不存在');
    }
    return { message: '删除成功' };
  }

  async generateTasks(plan: InspectionPlanDocument) {
    const tasks: any[] = [];
    const startDate = new Date(plan.startDate);
    const endDate = plan.endDate ? new Date(plan.endDate) : null;

    const dates: Date[] = [];
    let currentDate = new Date(startDate);

    if (plan.type === 'temporary') {
      dates.push(new Date(currentDate));
    } else {
      const maxDays = 365;
      let dayCount = 0;

      while (dayCount < maxDays) {
        if (endDate && currentDate > endDate) break;

        if (plan.type === 'daily') {
          dates.push(new Date(currentDate));
        } else if (plan.type === 'weekly') {
          if (dayCount % 7 === 0) dates.push(new Date(currentDate));
        } else if (plan.type === 'monthly') {
          if (currentDate.getDate() === startDate.getDate()) {
            dates.push(new Date(currentDate));
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
      }
    }

    for (const date of dates) {
      for (let i = 0; i < plan.assigneeIds.length; i++) {
        const assigneeId = plan.assigneeIds[i];
        const assigneeName = plan.assigneeNames?.[i] || '';

        const existing = await this.taskModel.findOne({
          planId: plan._id,
          assigneeId,
          scheduledDate: date,
        });

        if (!existing) {
          const checkpointsWithIds = plan.checkpoints.map(cp => ({
            ...cp,
            _id: cp._id || new Types.ObjectId().toString(),
          }));

          tasks.push({
            planId: plan._id,
            planName: plan.name,
            assigneeId,
            assigneeName,
            checkpoints: checkpointsWithIds,
            checkinRecords: [],
            status: InspectionTaskStatus.PENDING,
            scheduledDate: date,
            startTime: plan.startTime,
            endTime: plan.endTime,
            exceptionCount: 0,
          });
        }
      }
    }

    if (tasks.length > 0) {
      await this.taskModel.insertMany(tasks);
    }
  }

  async findAllTasks(query: any = {}) {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      status,
      assigneeId,
      planId,
      startDate,
      endDate,
    } = query;

    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { planName: { $regex: keyword, $options: 'i' } },
        { assigneeName: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (assigneeId) filter.assigneeId = new Types.ObjectId(assigneeId);
    if (planId) filter.planId = new Types.ObjectId(planId);

    if (startDate || endDate) {
      filter.scheduledDate = {};
      if (startDate) filter.scheduledDate.$gte = new Date(startDate);
      if (endDate) filter.scheduledDate.$lte = new Date(endDate);
    }

    const tasks = await this.taskModel
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ scheduledDate: -1, createdAt: -1 });

    const total = await this.taskModel.countDocuments(filter);

    return {
      list: tasks,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async findTask(id: string) {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('巡检任务不存在');
    }
    return task;
  }

  async startTask(id: string) {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('巡检任务不存在');
    }

    if (task.status !== InspectionTaskStatus.PENDING) {
      throw new BadRequestException('任务已开始或已完成');
    }

    task.status = InspectionTaskStatus.IN_PROGRESS;
    task.actualStartTime = new Date();
    return task.save();
  }

  async checkin(taskId: string, data: any) {
    const task = await this.taskModel.findById(taskId);
    if (!task) {
      throw new NotFoundException('巡检任务不存在');
    }

    if (task.status === InspectionTaskStatus.COMPLETED) {
      throw new BadRequestException('任务已完成，不能继续打卡');
    }

    if (task.status === InspectionTaskStatus.PENDING) {
      task.status = InspectionTaskStatus.IN_PROGRESS;
      task.actualStartTime = new Date();
    }

    const record: CheckinRecord = {
      _id: new Types.ObjectId(),
      checkpointId: new Types.ObjectId(data.checkpointId),
      checkpointName: data.checkpointName,
      checkinTime: data.checkinTime ? new Date(data.checkinTime) : new Date(),
      lng: data.lng,
      lat: data.lat,
      status: data.status as CheckinStatus,
      remark: data.remark,
      images: data.images || [],
    };

    task.checkinRecords.push(record);

    if (data.status === CheckinStatus.ABNORMAL) {
      task.exceptionCount = (task.exceptionCount || 0) + 1;
      task.status = InspectionTaskStatus.EXCEPTION;
    }

    const allChecked = task.checkinRecords.length >= task.checkpoints.length;
    const hasAbnormal = task.checkinRecords.some(r => r.status === CheckinStatus.ABNORMAL);

    if (allChecked && !hasAbnormal) {
      task.status = InspectionTaskStatus.COMPLETED;
      task.actualEndTime = new Date();
    }

    return task.save();
  }

  async completeTask(id: string) {
    const task = await this.taskModel.findById(id);
    if (!task) {
      throw new NotFoundException('巡检任务不存在');
    }

    const hasAbnormal = task.checkinRecords.some(r => r.status === CheckinStatus.ABNORMAL);

    task.status = hasAbnormal ? InspectionTaskStatus.EXCEPTION : InspectionTaskStatus.COMPLETED;
    task.actualEndTime = new Date();

    return task.save();
  }

  async reportException(data: any) {
    const task = await this.taskModel.findById(data.taskId);
    if (!task) {
      throw new NotFoundException('巡检任务不存在');
    }

    const exception = new this.exceptionModel({
      ...data,
      taskId: new Types.ObjectId(data.taskId),
      planId: data.planId ? new Types.ObjectId(data.planId) : task.planId,
      checkpointId: data.checkpointId ? new Types.ObjectId(data.checkpointId) : null,
      reporterId: new Types.ObjectId(data.reporterId),
      lng: data.lng,
      lat: data.lat,
    });

    const savedException = await exception.save();

    task.exceptionCount = (task.exceptionCount || 0) + 1;
    task.status = InspectionTaskStatus.EXCEPTION;
    await task.save();

    return savedException;
  }

  async createEventFromException(exceptionId: string, eventData: any) {
    const exception = await this.exceptionModel.findById(exceptionId);
    if (!exception) {
      throw new NotFoundException('异常记录不存在');
    }

    if (exception.eventId) {
      throw new BadRequestException('该异常已生成事件');
    }

    const event = new this.eventModel({
      title: eventData.title || exception.title,
      description: eventData.description || exception.description,
      category: eventData.category || exception.category,
      priority: eventData.priority || exception.priority,
      address: eventData.address || exception.address,
      lng: eventData.lng || exception.lng,
      lat: eventData.lat || exception.lat,
      images: eventData.images || exception.images || [],
      reporterId: exception.reporterId,
      reporterName: exception.reporterName,
      source: '巡检上报',
      inspectionExceptionId: exception._id,
    });

    const savedEvent = await event.save();

    exception.eventId = savedEvent._id as Types.ObjectId;
    exception.status = ExceptionStatus.PROCESSED;
    await exception.save();

    return savedEvent;
  }

  async findAllExceptions(query: any = {}) {
    const {
      page = 1,
      pageSize = 10,
      keyword,
      status,
      priority,
      category,
      taskId,
      planId,
      reporterId,
    } = query;

    const filter: any = {};

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { checkpointName: { $regex: keyword, $options: 'i' } },
        { reporterName: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (taskId) filter.taskId = new Types.ObjectId(taskId);
    if (planId) filter.planId = new Types.ObjectId(planId);
    if (reporterId) filter.reporterId = new Types.ObjectId(reporterId);

    const exceptions = await this.exceptionModel
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const total = await this.exceptionModel.countDocuments(filter);

    return {
      list: exceptions,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async getStatistics() {
    const totalPlans = await this.planModel.countDocuments();
    const totalTasks = await this.taskModel.countDocuments();
    const totalExceptions = await this.exceptionModel.countDocuments();

    const planStatusStats = await this.planModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const taskStatusStats = await this.taskModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const exceptionStatusStats = await this.exceptionModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTasks = await this.taskModel.countDocuments({ scheduledDate: { $gte: today } });
    const todayCompleted = await this.taskModel.countDocuments({
      actualEndTime: { $gte: today },
      status: { $in: [InspectionTaskStatus.COMPLETED, InspectionTaskStatus.EXCEPTION] },
    });
    const todayExceptions = await this.exceptionModel.countDocuments({ createdAt: { $gte: today } });

    return {
      totalPlans,
      totalTasks,
      totalExceptions,
      planStatusStats,
      taskStatusStats,
      exceptionStatusStats,
      todayTasks,
      todayCompleted,
      todayExceptions,
    };
  }
}
