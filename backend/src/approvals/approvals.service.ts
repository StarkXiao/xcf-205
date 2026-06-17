import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApprovalFlow,
  ApprovalFlowDocument,
  ApprovalFlowType,
} from '../schemas/approval-flow.schema';
import {
  ApprovalInstance,
  ApprovalInstanceDocument,
  ApprovalStatus,
  NodeInstanceStatus,
} from '../schemas/approval-instance.schema';
import {
  ApprovalLog,
  ApprovalLogDocument,
} from '../schemas/approval-log.schema';
import { NotificationsService } from '../notifications/notifications.service';
import {
  NotificationType,
  NotificationPriority,
} from '../schemas/notification.schema';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectModel(ApprovalFlow.name)
    private approvalFlowModel: Model<ApprovalFlowDocument>,
    @InjectModel(ApprovalInstance.name)
    private approvalInstanceModel: Model<ApprovalInstanceDocument>,
    @InjectModel(ApprovalLog.name)
    private approvalLogModel: Model<ApprovalLogDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async findAllFlows(query: any = {}) {
    const { type, isActive } = query;
    const filter: any = {};
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
    return this.approvalFlowModel.find(filter).sort({ createdAt: -1 });
  }

  async findOneFlow(id: string) {
    const flow = await this.approvalFlowModel.findById(id);
    if (!flow) throw new NotFoundException('审批流不存在');
    return flow;
  }

  async findFlowByType(type: ApprovalFlowType) {
    return this.approvalFlowModel.findOne({ type, isActive: true });
  }

  async createFlow(data: any) {
    const existing = await this.approvalFlowModel.findOne({ type: data.type });
    if (existing) {
      return this.approvalFlowModel.findByIdAndUpdate(existing._id, data, { new: true });
    }
    const flow = new this.approvalFlowModel(data);
    return flow.save();
  }

  async updateFlow(id: string, data: any) {
    const flow = await this.approvalFlowModel.findByIdAndUpdate(id, data, { new: true });
    if (!flow) throw new NotFoundException('审批流不存在');
    return flow;
  }

  async removeFlow(id: string) {
    const flow = await this.approvalFlowModel.findByIdAndDelete(id);
    if (!flow) throw new NotFoundException('审批流不存在');
    return { message: '删除成功' };
  }

  async findAllInstances(query: any = {}) {
    const {
      page = 1,
      pageSize = 10,
      type,
      status,
      applicantId,
      keyword,
      approverId,
    } = query;

    const filter: any = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (applicantId) filter.applicantId = new Types.ObjectId(applicantId);

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { reason: { $regex: keyword, $options: 'i' } },
        { relatedNo: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (approverId) {
      filter['nodeInstances'] = {
        $elemMatch: {
          approverId: new Types.ObjectId(approverId),
          status: NodeInstanceStatus.PENDING,
        },
      };
    }

    const list = await this.approvalInstanceModel
      .find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const total = await this.approvalInstanceModel.countDocuments(filter);

    return {
      list,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async findOneInstance(id: string) {
    const instance = await this.approvalInstanceModel.findById(id);
    if (!instance) throw new NotFoundException('审批实例不存在');
    return instance;
  }

  async submitApplication(data: {
    type: ApprovalFlowType;
    title: string;
    reason: string;
    relatedId: string;
    relatedNo: string;
    applicantId: string;
    applicantName: string;
    extraData?: Record<string, any>;
  }) {
    const flow = await this.findFlowByType(data.type);
    if (!flow) {
      throw new BadRequestException(`未找到类型为 ${data.type} 的启用审批流，请先配置审批流`);
    }

    const existingPending = await this.approvalInstanceModel.findOne({
      relatedId: new Types.ObjectId(data.relatedId),
      type: data.type,
      status: ApprovalStatus.PENDING,
    });
    if (existingPending) {
      throw new BadRequestException('该工单已有同类型的审批申请正在处理中');
    }

    const nodeInstances = flow.nodes.map((node, index) => ({
      nodeName: node.name,
      nodeType: node.type,
      nodeIndex: index,
      status: node.type === 'submit' ? NodeInstanceStatus.APPROVED : NodeInstanceStatus.PENDING,
      approverId: node.approverIds && node.approverIds.length > 0 ? node.approverIds[0] : undefined,
      comment: node.type === 'submit' ? '提交申请' : undefined,
      operateTime: node.type === 'submit' ? new Date() : undefined,
    }));

    let currentNodeIndex = 0;
    for (let i = 0; i < nodeInstances.length; i++) {
      if (nodeInstances[i].nodeType === 'approve' && nodeInstances[i].status === NodeInstanceStatus.PENDING) {
        currentNodeIndex = i;
        break;
      }
    }

    const instance = new this.approvalInstanceModel({
      flowId: flow._id,
      flowName: flow.name,
      type: data.type,
      title: data.title,
      reason: data.reason,
      status: ApprovalStatus.PENDING,
      relatedId: new Types.ObjectId(data.relatedId),
      relatedType: 'workorder',
      relatedNo: data.relatedNo,
      applicantId: new Types.ObjectId(data.applicantId),
      applicantName: data.applicantName,
      currentNodeIndex,
      nodeInstances,
      extraData: data.extraData || {},
    });

    await instance.save();

    await this.addLog(instance._id, {
      action: '提交申请',
      description: `${data.applicantName} 提交了${this.getTypeLabel(data.type)}申请`,
      operatorId: data.applicantId,
      operatorName: data.applicantName,
      to: { status: ApprovalStatus.PENDING, currentNodeIndex },
    });

    const currentNode = nodeInstances[currentNodeIndex];
    if (currentNode && currentNode.approverId) {
      await this.notificationsService.create({
        userId: currentNode.approverId.toString(),
        type: NotificationType.APPROVAL,
        title: `待审批：${this.getTypeLabel(data.type)}申请`,
        content: `${data.applicantName} 提交了${this.getTypeLabel(data.type)}申请：${data.title}`,
        relatedId: instance._id.toString(),
        relatedType: 'approval',
        senderId: data.applicantId,
        senderName: data.applicantName,
        priority: NotificationPriority.HIGH,
      });
    }

    return instance;
  }

  async approveNode(
    instanceId: string,
    data: {
      approverId: string;
      approverName: string;
      comment?: string;
    },
  ) {
    const instance = await this.approvalInstanceModel.findById(instanceId);
    if (!instance) throw new NotFoundException('审批实例不存在');
    if (instance.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('该审批已结束');
    }

    const currentNode = instance.nodeInstances[instance.currentNodeIndex];
    if (!currentNode) throw new BadRequestException('当前节点不存在');
    if (currentNode.status !== NodeInstanceStatus.PENDING) {
      throw new BadRequestException('当前节点已处理');
    }

    currentNode.status = NodeInstanceStatus.APPROVED;
    currentNode.approverId = new Types.ObjectId(data.approverId) as any;
    currentNode.approverName = data.approverName;
    currentNode.comment = data.comment || '同意';
    currentNode.operateTime = new Date();

    const nextNodeIndex = this.findNextPendingNode(instance.nodeInstances, instance.currentNodeIndex);

    await this.addLog(instanceId, {
      action: '审批通过',
      description: `${data.approverName} 在节点「${currentNode.nodeName}」审批通过${data.comment ? '：' + data.comment : ''}`,
      operatorId: data.approverId,
      operatorName: data.approverName,
      from: { nodeIndex: instance.currentNodeIndex, nodeStatus: NodeInstanceStatus.PENDING },
      to: { nodeIndex: nextNodeIndex, nodeStatus: NodeInstanceStatus.APPROVED },
    });

    if (nextNodeIndex === -1) {
      instance.status = ApprovalStatus.APPROVED;
      await instance.save();

      await this.addLog(instanceId, {
        action: '审批完成',
        description: `${this.getTypeLabel(instance.type)}申请已审批通过`,
        operatorId: data.approverId,
        operatorName: data.approverName,
        from: { status: ApprovalStatus.PENDING },
        to: { status: ApprovalStatus.APPROVED },
      });

      await this.notificationsService.create({
        userId: instance.applicantId.toString(),
        type: NotificationType.APPROVAL,
        title: `审批通过：${this.getTypeLabel(instance.type)}申请`,
        content: `您的${this.getTypeLabel(instance.type)}申请已审批通过：${instance.title}`,
        relatedId: instance._id.toString(),
        relatedType: 'approval',
        senderId: data.approverId,
        senderName: data.approverName,
        priority: NotificationPriority.MEDIUM,
      });

      await this.handleApprovalEffect(instance);
    } else {
      instance.currentNodeIndex = nextNodeIndex;
      await instance.save();

      const nextNode = instance.nodeInstances[nextNodeIndex];
      if (nextNode && nextNode.approverId) {
        await this.notificationsService.create({
          userId: nextNode.approverId.toString(),
          type: NotificationType.APPROVAL,
          title: `待审批：${this.getTypeLabel(instance.type)}申请`,
          content: `${instance.applicantName} 的${this.getTypeLabel(instance.type)}申请需要您审批：${instance.title}`,
          relatedId: instance._id.toString(),
          relatedType: 'approval',
          senderId: data.approverId,
          senderName: data.approverName,
          priority: NotificationPriority.HIGH,
        });
      }
    }

    return instance;
  }

  async rejectNode(
    instanceId: string,
    data: {
      approverId: string;
      approverName: string;
      comment: string;
    },
  ) {
    const instance = await this.approvalInstanceModel.findById(instanceId);
    if (!instance) throw new NotFoundException('审批实例不存在');
    if (instance.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('该审批已结束');
    }

    const currentNode = instance.nodeInstances[instance.currentNodeIndex];
    if (!currentNode) throw new BadRequestException('当前节点不存在');
    if (currentNode.status !== NodeInstanceStatus.PENDING) {
      throw new BadRequestException('当前节点已处理');
    }

    currentNode.status = NodeInstanceStatus.REJECTED;
    currentNode.approverId = new Types.ObjectId(data.approverId) as any;
    currentNode.approverName = data.approverName;
    currentNode.comment = data.comment;
    currentNode.operateTime = new Date();

    instance.status = ApprovalStatus.REJECTED;
    await instance.save();

    await this.addLog(instanceId, {
      action: '审批驳回',
      description: `${data.approverName} 在节点「${currentNode.nodeName}」驳回了申请：${data.comment}`,
      operatorId: data.approverId,
      operatorName: data.approverName,
      from: { nodeIndex: instance.currentNodeIndex, status: ApprovalStatus.PENDING },
      to: { status: ApprovalStatus.REJECTED },
    });

    await this.notificationsService.create({
      userId: instance.applicantId.toString(),
      type: NotificationType.APPROVAL,
      title: `审批驳回：${this.getTypeLabel(instance.type)}申请`,
      content: `您的${this.getTypeLabel(instance.type)}申请被驳回：${data.comment}`,
      relatedId: instance._id.toString(),
      relatedType: 'approval',
      senderId: data.approverId,
      senderName: data.approverName,
      priority: NotificationPriority.HIGH,
    });

    return instance;
  }

  async cancelInstance(
    instanceId: string,
    data: {
      operatorId: string;
      operatorName: string;
    },
  ) {
    const instance = await this.approvalInstanceModel.findById(instanceId);
    if (!instance) throw new NotFoundException('审批实例不存在');
    if (instance.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('只能撤销待审批的申请');
    }

    instance.status = ApprovalStatus.CANCELLED;
    await instance.save();

    await this.addLog(instanceId, {
      action: '撤销申请',
      description: `${data.operatorName} 撤销了申请`,
      operatorId: data.operatorId,
      operatorName: data.operatorName,
      from: { status: ApprovalStatus.PENDING },
      to: { status: ApprovalStatus.CANCELLED },
    });

    return instance;
  }

  async getLogs(instanceId: string) {
    return this.approvalLogModel
      .find({ instanceId })
      .sort({ createdAt: 1 });
  }

  async getPendingCount(approverId: string) {
    return this.approvalInstanceModel.countDocuments({
      status: ApprovalStatus.PENDING,
      'nodeInstances': {
        $elemMatch: {
          approverId: new Types.ObjectId(approverId),
          status: NodeInstanceStatus.PENDING,
        },
      },
    });
  }

  private findNextPendingNode(nodeInstances: any[], currentIndex: number): number {
    for (let i = currentIndex + 1; i < nodeInstances.length; i++) {
      if (nodeInstances[i].nodeType === 'approve' && nodeInstances[i].status === NodeInstanceStatus.PENDING) {
        return i;
      }
    }
    return -1;
  }

  private async handleApprovalEffect(instance: ApprovalInstanceDocument) {
    const { WorkOrder, WorkOrderStatus } = await import('../schemas/workorder.schema');
  }

  private async addLog(instanceId: Types.ObjectId | string, logData: any) {
    const log = new this.approvalLogModel({
      instanceId: new Types.ObjectId(instanceId as string),
      ...logData,
    });
    return log.save();
  }

  private getTypeLabel(type: ApprovalFlowType): string {
    const labels: Record<ApprovalFlowType, string> = {
      [ApprovalFlowType.EXTENSION]: '延期',
      [ApprovalFlowType.REASSIGN]: '改派',
      [ApprovalFlowType.CLOSE_REJECT]: '关闭驳回',
    };
    return labels[type] || type;
  }
}
