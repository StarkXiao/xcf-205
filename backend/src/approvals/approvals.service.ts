import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ApprovalFlow,
  ApprovalFlowDocument,
  ApprovalFlowType,
  ApproverType,
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
import { WorkOrder, WorkOrderDocument, WorkOrderStatus } from '../schemas/workorder.schema';
import { WorkOrderLog, WorkOrderLogDocument } from '../schemas/workorder-log.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
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
    @InjectModel(WorkOrder.name)
    private workOrderModel: Model<WorkOrderDocument>,
    @InjectModel(WorkOrderLog.name)
    private workOrderLogModel: Model<WorkOrderLogDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
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

    const applicant = await this.userModel.findById(data.applicantId);
    if (!applicant) {
      throw new NotFoundException('申请人不存在');
    }

    const nodeInstances = [];
    for (let i = 0; i < flow.nodes.length; i++) {
      const node = flow.nodes[i];
      const approver = await this.resolveNodeApprover(node, applicant, data.relatedId);

      nodeInstances.push({
        nodeName: node.name,
        nodeType: node.type,
        nodeIndex: i,
        status: node.type === 'submit' ? NodeInstanceStatus.APPROVED : NodeInstanceStatus.PENDING,
        approverId: node.type === 'submit'
          ? new Types.ObjectId(data.applicantId)
          : approver?._id,
        approverName: node.type === 'submit'
          ? data.applicantName
          : approver?.realName,
        comment: node.type === 'submit' ? '提交申请' : undefined,
        operateTime: node.type === 'submit' ? new Date() : undefined,
        approverType: node.approverType,
        roleCode: node.roleCode,
        approverIds: node.approverIds,
      });
    }

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
    if (!currentNode.approverId || currentNode.approverId.toString() !== data.approverId) {
      throw new BadRequestException('您不是当前节点的审批人，无法操作');
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
      const applicant = await this.userModel.findById(instance.applicantId);
      const nextNodeData = instance.nodeInstances[nextNodeIndex];
      const nextApprover = await this.resolveNodeApprover(
        nextNodeData,
        applicant,
        instance.relatedId.toString(),
      );

      if (nextApprover) {
        nextNodeData.approverId = nextApprover._id;
        nextNodeData.approverName = nextApprover.realName;
      }

      instance.currentNodeIndex = nextNodeIndex;
      await instance.save();

      if (nextNodeData.approverId) {
        await this.notificationsService.create({
          userId: nextNodeData.approverId.toString(),
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
    if (!currentNode.approverId || currentNode.approverId.toString() !== data.approverId) {
      throw new BadRequestException('您不是当前节点的审批人，无法操作');
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
    if (instance.applicantId.toString() !== data.operatorId) {
      throw new BadRequestException('只有申请人可以撤销申请');
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

    const currentNode = instance.nodeInstances[instance.currentNodeIndex];
    if (currentNode?.approverId) {
      await this.notificationsService.create({
        userId: currentNode.approverId.toString(),
        type: NotificationType.APPROVAL,
        title: `申请已撤销：${this.getTypeLabel(instance.type)}申请`,
        content: `${data.operatorName} 撤销了${this.getTypeLabel(instance.type)}申请：${instance.title}`,
        relatedId: instance._id.toString(),
        relatedType: 'approval',
        senderId: data.operatorId,
        senderName: data.operatorName,
        priority: NotificationPriority.LOW,
      });
    }

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

  private async resolveNodeApprover(
    node: any,
    applicant: UserDocument | null,
    relatedId: string,
  ): Promise<UserDocument | null> {
    if (!node || node.nodeType !== 'approve') {
      return null;
    }

    const approverType = node.approverType || 'specific';

    switch (approverType) {
      case ApproverType.SPECIFIC:
        if (node.approverIds && node.approverIds.length > 0) {
          const approverId = Array.isArray(node.approverIds)
            ? node.approverIds[0]
            : node.approverIds;
          return this.userModel.findById(approverId);
        }
        return null;

      case ApproverType.ROLE:
        if (node.roleCode) {
          const role = await this.roleModel.findOne({ code: node.roleCode });
          if (role) {
            const users = await this.userModel
              .find({ roleId: role._id, isActive: true })
              .limit(1);
            return users.length > 0 ? users[0] : null;
          }
        }
        return null;

      case ApproverType.DEPARTMENT_HEAD:
        if (applicant?.department) {
          const role = await this.roleModel.findOne({ code: 'dept_head' });
          if (role) {
            const users = await this.userModel
              .find({
                roleId: role._id,
                department: applicant.department,
                isActive: true,
              })
              .limit(1);
            if (users.length > 0) {
              return users[0];
            }
          }
          const adminRole = await this.roleModel.findOne({ code: 'admin' });
          if (adminRole) {
            const admins = await this.userModel
              .find({ roleId: adminRole._id, isActive: true })
              .limit(1);
            return admins.length > 0 ? admins[0] : null;
          }
        }
        return null;

      default:
        return null;
    }
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
    const workOrderId = instance.relatedId;
    if (!workOrderId) return;

    const workOrder = await this.workOrderModel.findById(workOrderId);
    if (!workOrder) return;

    switch (instance.type) {
      case ApprovalFlowType.EXTENSION:
        await this.handleExtensionEffect(workOrder, instance);
        break;
      case ApprovalFlowType.REASSIGN:
        await this.handleReassignEffect(workOrder, instance);
        break;
      case ApprovalFlowType.CLOSE_REJECT:
        await this.handleCloseRejectEffect(workOrder, instance);
        break;
    }
  }

  private async handleExtensionEffect(
    workOrder: WorkOrderDocument,
    instance: ApprovalInstanceDocument,
  ) {
    const extraData = instance.extraData || {};
    if (extraData.newDeadline) {
      const oldDeadline = workOrder.deadline;
      workOrder.deadline = new Date(extraData.newDeadline);
      await workOrder.save();

      const log = new this.workOrderLogModel({
        workOrderId: workOrder._id,
        action: '延期',
        description: `审批通过，延期${extraData.extensionDays || ''}天，截止时间从${oldDeadline ? new Date(oldDeadline).toLocaleString() : '不限'}延长至${new Date(extraData.newDeadline).toLocaleString()}`,
        operatorId: instance.applicantId,
        operatorName: instance.applicantName,
        from: { deadline: oldDeadline },
        to: { deadline: extraData.newDeadline },
      });
      await log.save();

      await this.workOrderModel.findByIdAndUpdate(workOrder._id, {
        $push: { logs: log._id },
      });
    }
  }

  private async handleReassignEffect(
    workOrder: WorkOrderDocument,
    instance: ApprovalInstanceDocument,
  ) {
    const extraData = instance.extraData || {};
    if (extraData.newHandlerId) {
      const oldHandler = workOrder.handlerName;
      const oldHandlerId = workOrder.handlerId;

      workOrder.handlerId = new Types.ObjectId(extraData.newHandlerId) as any;
      workOrder.handlerName = extraData.newHandlerName || '';
      workOrder.department = extraData.newHandlerDepartment || workOrder.department;
      await workOrder.save();

      const log = new this.workOrderLogModel({
        workOrderId: workOrder._id,
        action: '改派',
        description: `审批通过，处理人从 ${oldHandler} 改为 ${extraData.newHandlerName}`,
        operatorId: instance.applicantId,
        operatorName: instance.applicantName,
        from: { handlerId: oldHandlerId, handlerName: oldHandler },
        to: { handlerId: extraData.newHandlerId, handlerName: extraData.newHandlerName },
      });
      await log.save();

      await this.workOrderModel.findByIdAndUpdate(workOrder._id, {
        $push: { logs: log._id },
      });

      await this.notificationsService.create({
        userId: extraData.newHandlerId,
        type: NotificationType.TODO,
        title: '工单改派通知',
        content: `工单【${workOrder.orderNo}】已改派给您处理：${workOrder.title}`,
        relatedId: workOrder._id.toString(),
        relatedType: 'workorder',
        senderId: instance.applicantId,
        senderName: instance.applicantName,
        priority: NotificationPriority.HIGH,
      });
    }
  }

  private async handleCloseRejectEffect(
    workOrder: WorkOrderDocument,
    instance: ApprovalInstanceDocument,
  ) {
    const oldStatus = workOrder.status;
    workOrder.status = WorkOrderStatus.PROCESSING;
    await workOrder.save();

    const log = new this.workOrderLogModel({
      workOrderId: workOrder._id,
      action: '关闭驳回',
      description: `审批通过，关闭驳回，工单从「${oldStatus}」状态恢复为处理中`,
      operatorId: instance.applicantId,
      operatorName: instance.applicantName,
      from: { status: oldStatus },
      to: { status: WorkOrderStatus.PROCESSING },
    });
    await log.save();

    await this.workOrderModel.findByIdAndUpdate(workOrder._id, {
      $push: { logs: log._id },
    });

    if (workOrder.handlerId) {
      await this.notificationsService.create({
        userId: workOrder.handlerId.toString(),
        type: NotificationType.TODO,
        title: '工单关闭驳回通知',
        content: `工单【${workOrder.orderNo}】被关闭驳回，请重新处理：${workOrder.title}`,
        relatedId: workOrder._id.toString(),
        relatedType: 'workorder',
        senderId: instance.applicantId,
        senderName: instance.applicantName,
        priority: NotificationPriority.HIGH,
      });
    }
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
