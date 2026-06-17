import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApprovalsController } from './approvals.controller';
import { ApprovalsService } from './approvals.service';
import { ApprovalFlow, ApprovalFlowSchema } from '../schemas/approval-flow.schema';
import { ApprovalInstance, ApprovalInstanceSchema } from '../schemas/approval-instance.schema';
import { ApprovalLog, ApprovalLogSchema } from '../schemas/approval-log.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ApprovalFlow.name, schema: ApprovalFlowSchema },
      { name: ApprovalInstance.name, schema: ApprovalInstanceSchema },
      { name: ApprovalLog.name, schema: ApprovalLogSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [ApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}
