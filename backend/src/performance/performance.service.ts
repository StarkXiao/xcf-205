import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Event, EventStatus } from '../schemas/event.schema';
import { WorkOrder, WorkOrderStatus } from '../schemas/workorder.schema';
import { InspectionTask, InspectionTaskStatus } from '../schemas/inspection.schema';
import { User } from '../schemas/user.schema';

@Injectable()
export class PerformanceService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<any>,
    @InjectModel(WorkOrder.name) private workOrderModel: Model<any>,
    @InjectModel(InspectionTask.name) private inspectionTaskModel: Model<any>,
    @InjectModel(User.name) private userModel: Model<any>,
  ) {}

  private getMonthRange(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }

  private formatHours(hours: number): string {
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

  async getDepartmentRanking(year: number, month: number) {
    const { startDate, endDate } = this.getMonthRange(year, month);

    const workOrderStats = await this.workOrderModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          department: { $exists: true, $ne: '' },
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
        },
      },
    ]);

    const eventStats = await this.eventModel.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          handlerName: { $exists: true, $ne: '' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'handlerId',
          foreignField: '_id',
          as: 'handler',
        },
      },
      {
        $unwind: { path: '$handler', preserveNullAndEmptyArrays: true },
      },
      {
        $group: {
          _id: '$handler.department',
          totalEvents: { $sum: 1 },
          resolvedEvents: {
            $sum: {
              $cond: [
                { $in: ['$status', ['resolved', 'closed']] },
                1,
                0,
              ],
            },
          },
          totalResponseDuration: {
            $sum: {
              $cond: [
                { $ifNull: ['$updatedAt', false] },
                {
                  $divide: [
                    { $subtract: ['$updatedAt', '$createdAt'] },
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
    workOrderStats.forEach(s => departments.add(s._id));
    eventStats.forEach(s => s._id && departments.add(s._id));
    inspectionStats.forEach(s => s._id && departments.add(s._id));

    const rankings = Array.from(departments).map(department => {
      const woStat = workOrderStats.find(s => s._id === department) || {
        totalWorkOrders: 0,
        completedWorkOrders: 0,
        verifiedWorkOrders: 0,
        onTimeCompleted: 0,
        totalHandleDuration: 0,
        totalVerifyDuration: 0,
      };

      const evStat = eventStats.find(s => s._id === department) || {
        totalEvents: 0,
        resolvedEvents: 0,
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
        woStat.verifiedWorkOrders > 0 && woStat.completedWorkOrders > 0
          ? Math.round((woStat.verifiedWorkOrders / woStat.totalWorkOrders) * 100)
          : 0;

      const eventResolveRate =
        evStat.totalEvents > 0
          ? Math.round((evStat.resolvedEvents / evStat.totalEvents) * 100)
          : 0;

      const avgResponseDuration =
        evStat.resolvedEvents > 0
          ? evStat.totalResponseDuration / evStat.resolvedEvents
          : 0;

      const inspectionPassRate =
        inStat.totalInspections > 0
          ? Math.round((inStat.completedInspections / inStat.totalInspections) * 100)
          : 0;

      const totalScore =
        workOrderCompletionRate * 0.3 +
        onTimeRate * 0.2 +
        verifyPassRate * 0.2 +
        eventResolveRate * 0.15 +
        inspectionPassRate * 0.15;

      return {
        department,
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
          total: evStat.totalEvents,
          resolved: evStat.resolvedEvents,
          resolveRate: eventResolveRate,
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

    return workOrders.map(wo => {
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
        handleTime: wo.handleTime,
        verifyTime: wo.verifyTime,
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
      handlerName: { $exists: true, $ne: '' },
    };

    let events = await this.eventModel.find(filter).sort({ createdAt: -1 });

    if (department) {
      const users = await this.userModel.find({ department });
      const userIds = users.map(u => u._id.toString());
      events = events.filter(e => userIds.includes(e.handlerId?.toString()));
    }

    return events.map(event => {
      const responseDuration =
        event.updatedAt && event.createdAt
          ? (event.updatedAt.getTime() - event.createdAt.getTime()) / (1000 * 60 * 60)
          : null;

      return {
        id: event._id,
        title: event.title,
        category: event.category,
        priority: event.priority,
        status: event.status,
        reporterName: event.reporterName,
        handlerName: event.handlerName,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
        responseDuration,
        responseDurationText: responseDuration !== null ? this.formatHours(responseDuration) : null,
        isResolved: event.status === 'resolved' || event.status === 'closed',
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

    return tasks.map(task => {
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

    const totalEvents = await this.eventModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const resolvedEvents = await this.eventModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['resolved', 'closed'] },
    });

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

    const eventResolveRate =
      totalEvents > 0 ? Math.round((resolvedEvents / totalEvents) * 100) : 0;

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
        total: totalEvents,
        resolved: resolvedEvents,
        resolveRate: eventResolveRate,
      },
      inspections: {
        total: totalInspections,
        completed: completedInspections,
        passRate: inspectionPassRate,
      },
    };
  }

  async getDepartmentList() {
    const users = await this.userModel.aggregate([
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
      { $sort: { _id: 1 } },
    ]);

    return users.map(item => ({
      department: item._id,
      userCount: item.userCount,
    }));
  }
}
