import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalFlow, ApprovalFlowSchema } from '../schemas/approval-flow.schema';
import { ApprovalInstance, ApprovalInstanceSchema } from '../schemas/approval-instance.schema';
import { ApprovalLog, ApprovalLogSchema } from '../schemas/approval-log.schema';
import { WorkOrder, WorkOrderSchema } from '../schemas/workorder.schema';
import { WorkOrderLog, WorkOrderLogSchema } from '../schemas/workorder-log.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Role, RoleSchema } from '../schemas/role.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalFlow.name, schema: ApprovalFlowSchema },
      { name: ApprovalInstance.name, schema: ApprovalInstanceSchema },
      { name: ApprovalLog.name, schema: ApprovalLogSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: WorkOrderLog.name, schema: WorkOrderLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
