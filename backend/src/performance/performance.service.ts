import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventStatus } from '../schemas/event.schema';
import { WorkOrder, WorkOrderStatus } from '../schemas/workorder.schema';
import { WorkOrderLog, WorkOrderLogDocument } from '../schemas/workorder-log.schema';
import { InspectionTask, InspectionTaskStatus } from '../schemas/inspection.schema';
import { User } from '../schemas/user.schema';
import { DictionariesService } from '../dictionaries/dictionaries.service';
import { DictionaryType } from '../schemas/dictionary.schema';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<any>,
    @InjectModel(WorkOrder.name) private workOrderModel: Model<any>,
    @InjectModel(WorkOrderLog.name) private workOrderLogModel: Model<WorkOrderLogDocument>,
    @InjectModel(InspectionTask.name) private inspectionTaskModel: Model<any>,
    @InjectModel(User.name) private userModel: Model<any>,
    private readonly dictionariesService: DictionariesService,
  ) {}

  private getMonthRange(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  private formatHours(hours: number): string {
    if (!hours || hours <= 0) return '0分钟';
    if (hours < 1) {
      return `${Math.round(hours * 60)}分钟`;
    }
    if (hours < 24) {
      return `${hours.toFixed(1)}小时`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}天${remainingHours.toFixed(0)}小时`;
  }

  private async getFirstResponseTimeMap(workOrderIds: Types.ObjectId[]): Promise<Map<string, Date>> {
    const result = await this.workOrderLogModel.aggregate([
      {
        $match: {
          workOrderId: { $in: workOrderIds },
          action: { $in: ['派单', '开始处理', '创建工单'] },
        },
      },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$workOrderId',
          firstResponseTime: { $first: '$createdAt' },
        },
      },
    ]);
    const map = new Map<string, Date>();
    result.forEach(item => {
      map.set(item._id.toString(), item.firstResponseTime);
    });
    return map;
  }

  async getDepartmentRanking(year: number, month: number) {
    const { startDate, endDate } = this.getMonthRange(year, month);
    const departmentMap = await this.dictionariesService.getDictionaryMap(DictionaryType.DEPARTMENT);

    const workOrderStats = await this.workOrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          department: { $exists: true, $ne: '' },
        },
      },
      {
        $lookup: {
          from: 'workorderlogs',
          localField: '_id',
          foreignField: 'workOrderId',
          as: 'logs',
        },
      },
      {
        $addFields: {
          firstResponseLog: {
            $filter: {
              input: '$logs',
              as: 'log',
              cond: { $in: ['$$log.action', ['派单', '开始处理', '创建工单']] },
            },
          },
        },
      },
      {
        $addFields: {
          firstResponseTime: {
            $min: {
              $map: {
                input: '$firstResponseLog',
                as: 'log',
                in: '$$log.createdAt',
              },
            },
          },
        },
      },
      {
        $group: {
          _id: '$department',
          totalWorkOrders: { $sum: 1 },
          completedWorkOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['completed', 'verified', 'closed']] },
                1,
                0,
              ],
            },
          },
          verifiedWorkOrders: {
            $sum: {
              $cond: [{ $eq: ['$status', 'verified'] }, 1, 0],
            },
          },
          onTimeCompleted: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $in: ['$status', ['completed', 'verified', 'closed']] },
                    { $ifNull: ['$handleTime', false] },
                    { $ifNull: ['$deadline', false] },
                    { $lte: ['$handleTime', '$deadline'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalHandleDuration: {
            $sum: {
              $cond: [
                { $ifNull: ['$handleTime', false] },
                {
                  $divide: [
                    { $subtract: ['$handleTime', '$createdAt'] },
                    1000 * 60 * 60,
                  ],
                },
                0,
              ],
            },
          },
          totalVerifyDuration: {
            $sum: {
              $cond: [
                { $ifNull: ['$verifyTime', false] },
                {
                  $divide: [
                    { $subtract: ['$verifyTime', '$handleTime'] },
                    1000 * 60 * 60,
                  ],
                },
                0,
              ],
            },
          },
          respondedCount: {
            $sum: {
              $cond: [{ $ifNull: ['$firstResponseTime', false] }, 1, 0],
            },
          },
          totalResponseDuration: {
            $sum: {
              $cond: [
                { $ifNull: ['$firstResponseTime', false] },
                {
                  $divide: [
                    { $subtract: ['$firstResponseTime', '$createdAt'] },
                    1000 * 60 * 60,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
    ]);

    const inspectionStats = await this.inspectionTaskModel.aggregate([
      {
        $match: {
          scheduledDate: { $gte: startDate, $lte: endDate },
          assigneeName: { $exists: true, $ne: '' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assigneeId',
          foreignField: '_id',
          as: 'assignee',
        },
      },
      {
        $unwind: { path: '$assignee', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$assignee.department',
          totalInspections: { $sum: 1 },
          completedInspections: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'completed'] },
                1,
                0,
              ],
            },
          },
          exceptionInspections: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'exception'] },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const departments = new Set<string>();
    workOrderStats.forEach(s => s._id && departments.add(s._id));
    inspectionStats.forEach(s => s._id && departments.add(s._id));

    const rankings = Array.from(departments).map(department => {
      const woStat = workOrderStats.find(s => s._id === department) || {
        totalWorkOrders: 0,
        completedWorkOrders: 0,
        verifiedWorkOrders: 0,
        onTimeCompleted: 0,
        totalHandleDuration: 0,
        totalVerifyDuration: 0,
        respondedCount: 0,
        totalResponseDuration: 0,
      };

      const inStat = inspectionStats.find(s => s._id === department) || {
        totalInspections: 0,
        completedInspections: 0,
        exceptionInspections: 0,
      };

      const workOrderCompletionRate =
        woStat.totalWorkOrders > 0
          ? Math.round((woStat.completedWorkOrders / woStat.totalWorkOrders) * 100)
          : 0;

      const onTimeRate =
        woStat.completedWorkOrders > 0
          ? Math.round((woStat.onTimeCompleted / woStat.completedWorkOrders) * 100)
          : 0;

      const avgHandleDuration =
        woStat.completedWorkOrders > 0
          ? woStat.totalHandleDuration / woStat.completedWorkOrders
          : 0;

      const avgVerifyDuration =
        woStat.verifiedWorkOrders > 0
          ? woStat.totalVerifyDuration / woStat.verifiedWorkOrders
          : 0;

      const verifyPassRate =
        woStat.totalWorkOrders > 0
          ? Math.round((woStat.verifiedWorkOrders / woStat.totalWorkOrders) * 100)
          : 0;

      const eventResponseRate =
        woStat.totalWorkOrders > 0
          ? Math.round((woStat.respondedCount / woStat.totalWorkOrders) * 100)
          : 0;

      const avgResponseDuration =
        woStat.respondedCount > 0
          ? woStat.totalResponseDuration / woStat.respondedCount
          : 0;

      const inspectionPassRate =
        inStat.totalInspections > 0
          ? Math.round((inStat.completedInspections / inStat.totalInspections) * 100)
          : 0;

      const totalScore =
        workOrderCompletionRate * 0.3 +
        onTimeRate * 0.2 +
        verifyPassRate * 0.2 +
        eventResponseRate * 0.15 +
        inspectionPassRate * 0.15;

      return {
        department,
        departmentName: departmentMap[department] || department,
        workOrders: {
          total: woStat.totalWorkOrders,
          completed: woStat.completedWorkOrders,
          verified: woStat.verifiedWorkOrders,
          onTimeCompleted: woStat.onTimeCompleted,
          completionRate: workOrderCompletionRate,
          onTimeRate,
          verifyPassRate,
          avgHandleDuration,
          avgHandleDurationText: this.formatHours(avgHandleDuration),
          avgVerifyDuration,
          avgVerifyDurationText: this.formatHours(avgVerifyDuration),
        },
        events: {
          total: woStat.totalWorkOrders,
          responded: woStat.respondedCount,
          responseRate: eventResponseRate,
          avgResponseDuration,
          avgResponseDurationText: this.formatHours(avgResponseDuration),
        },
        inspections: {
          total: inStat.totalInspections,
          completed: inStat.completedInspections,
          exceptions: inStat.exceptionInspections,
          passRate: inspectionPassRate,
        },
        totalScore: Math.round(totalScore * 100) / 100,
      };
    });

    rankings.sort((a, b) => b.totalScore - a.totalScore);

    return rankings.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }

  async getWorkOrderDetailReport(year: number, month: number, department?: string) {
    const { startDate, endDate } = this.getMonthRange(year, month);

    const filter: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    if (department) {
      filter.department = department;
    }

    const workOrders = await this.workOrderModel
      .find(filter)
      .populate('eventId')
      .sort({ createdAt: -1 });

    const workOrderIds = workOrders.map((wo: any) => wo._id);
    const firstResponseMap = await this.getFirstResponseTimeMap(workOrderIds);

    return workOrders.map((wo: any) => {
      const firstResponseTime = firstResponseMap.get(wo._id.toString()) || null;

      const responseDuration =
        firstResponseTime && wo.createdAt
          ? (firstResponseTime.getTime() - wo.createdAt.getTime()) / (1000 * 60 * 60)
          : null;

      const handleDuration =
        wo.handleTime && wo.createdAt
          ? (wo.handleTime.getTime() - wo.createdAt.getTime()) / (1000 * 60 * 60)
          : null;

      const verifyDuration =
        wo.verifyTime && wo.handleTime
          ? (wo.verifyTime.getTime() - wo.handleTime.getTime()) / (1000 * 60 * 60)
          : null;

      const isOnTime =
        wo.handleTime && wo.deadline
          ? wo.handleTime <= wo.deadline
          : null;

      return {
        id: wo._id,
        orderNo: wo.orderNo,
        title: wo.title,
        department: wo.department,
        handlerName: wo.handlerName,
        priority: wo.priority,
        status: wo.status,
        createdAt: wo.createdAt,
        deadline: wo.deadline,
        firstResponseTime,
        handleTime: wo.handleTime,
        verifyTime: wo.verifyTime,
        responseDuration,
        responseDurationText: responseDuration !== null ? this.formatHours(responseDuration) : null,
        handleDuration,
        handleDurationText: handleDuration !== null ? this.formatHours(handleDuration) : null,
        verifyDuration,
        verifyDurationText: verifyDuration !== null ? this.formatHours(verifyDuration) : null,
        isOnTime,
        verifyPassed: wo.status === 'verified',
      };
    });
  }

  async getEventDetailReport(year: number, month: number, department?: string) {
    const { startDate, endDate } = this.getMonthRange(year, month);

    const filter: any = {
      createdAt: { $gte: startDate, $lte: endDate },
    };

    const workOrders = await this.workOrderModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
        ...(department ? { department } : {}),
      })
      .populate('eventId')
      .sort({ createdAt: -1 });

    const workOrderIds = workOrders.map((wo: any) => wo._id);
    const firstResponseMap = await this.getFirstResponseTimeMap(workOrderIds);

    return workOrders.map((wo: any) => {
      const event = wo.eventId || {};
      const firstResponseTime = firstResponseMap.get(wo._id.toString()) || null;

      const responseDuration =
        firstResponseTime && wo.createdAt
          ? (firstResponseTime.getTime() - wo.createdAt.getTime()) / (1000 * 60 * 60)
          : null;

      return {
        id: event._id || wo._id,
        workOrderId: wo._id,
        orderNo: wo.orderNo,
        title: event.title || wo.title,
        category: event.category,
        priority: event.priority || wo.priority,
        status: wo.status,
        reporterName: event.reporterName,
        handlerName: wo.handlerName,
        department: wo.department,
        createdAt: wo.createdAt,
        firstResponseTime,
        handleTime: wo.handleTime,
        responseDuration,
        responseDurationText: responseDuration !== null ? this.formatHours(responseDuration) : null,
        isResolved: ['completed', 'verified', 'closed'].includes(wo.status),
      };
    });
  }

  async getInspectionDetailReport(year: number, month: number, department?: string) {
    const { startDate, endDate } = this.getMonthRange(year, month);

    const filter: any = {
      scheduledDate: { $gte: startDate, $lte: endDate },
      assigneeName: { $exists: true, $ne: '' },
    };

    let tasks = await this.inspectionTaskModel.find(filter).sort({ scheduledDate: -1 });

    if (department) {
      const users = await this.userModel.find({ department });
      const userIds = users.map(u => u._id.toString());
      tasks = tasks.filter(t => userIds.includes(t.assigneeId?.toString()));
    }

    return tasks.map((task: any) => {
      const taskDuration =
        task.actualEndTime && task.actualStartTime
          ? (task.actualEndTime.getTime() - task.actualStartTime.getTime()) / (1000 * 60 * 60)
          : null;

      const checkinCount = task.checkinRecords?.length || 0;
      const totalCheckpoints = task.checkpoints?.length || 0;
      const completionRate =
        totalCheckpoints > 0 ? Math.round((checkinCount / totalCheckpoints) * 100) : 0;

      return {
        id: task._id,
        planName: task.planName,
        assigneeName: task.assigneeName,
        status: task.status,
        scheduledDate: task.scheduledDate,
        actualStartTime: task.actualStartTime,
        actualEndTime: task.actualEndTime,
        taskDuration,
        taskDurationText: taskDuration !== null ? this.formatHours(taskDuration) : null,
        totalCheckpoints,
        checkinCount,
        completionRate,
        exceptionCount: task.exceptionCount || 0,
        isPassed: task.status === 'completed',
      };
    });
  }

  async getMonthlySummary(year: number, month: number) {
    const { startDate, endDate } = this.getMonthRange(year, month);

    const totalWorkOrders = await this.workOrderModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const completedWorkOrders = await this.workOrderModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['completed', 'verified', 'closed'] },
    });

    const verifiedWorkOrders = await this.workOrderModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'verified',
    });

    const respondedOrders = await this.workOrderLogModel.aggregate([
      {
        $match: {
          action: { $in: ['派单', '开始处理', '创建工单'] },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$workOrderId' } },
      { $count: 'count' },
    ]);

    const respondedCount = respondedOrders[0]?.count || 0;

    const totalInspections = await this.inspectionTaskModel.countDocuments({
      scheduledDate: { $gte: startDate, $lte: endDate },
    });

    const completedInspections = await this.inspectionTaskModel.countDocuments({
      scheduledDate: { $gte: startDate, $lte: endDate },
      status: 'completed',
    });

    const workOrderCompletionRate =
      totalWorkOrders > 0
        ? Math.round((completedWorkOrders / totalWorkOrders) * 100)
        : 0;

    const verifyPassRate =
      totalWorkOrders > 0
        ? Math.round((verifiedWorkOrders / totalWorkOrders) * 100)
        : 0;

    const eventResponseRate =
      totalWorkOrders > 0
        ? Math.round((respondedCount / totalWorkOrders) * 100)
        : 0;

    const inspectionPassRate =
      totalInspections > 0
        ? Math.round((completedInspections / totalInspections) * 100)
        : 0;

    return {
      year,
      month,
      workOrders: {
        total: totalWorkOrders,
        completed: completedWorkOrders,
        verified: verifiedWorkOrders,
        completionRate: workOrderCompletionRate,
        verifyPassRate,
      },
      events: {
        total: totalWorkOrders,
        responded: respondedCount,
        responseRate: eventResponseRate,
      },
      inspections: {
        total: totalInspections,
        completed: completedInspections,
        passRate: inspectionPassRate,
      },
    };
  }

  async getDepartmentList() {
    const userStats = await this.userModel.aggregate([
      {
        $match: {
          department: { $exists: true, $ne: '' },
        },
      },
      {
        $group: {
          _id: '$department',
          userCount: { $sum: 1 },
        },
      },
    ]);

    const userCountMap = new Map(userStats.map(item => [item._id, item.userCount]));
    const dictionaryDepts = await this.dictionariesService.findByType(DictionaryType.DEPARTMENT);

    return dictionaryDepts.map(dept => ({
      department: dept.code,
      departmentName: dept.name,
      userCount: userCountMap.get(dept.code) || 0,
    }));
  }
}
