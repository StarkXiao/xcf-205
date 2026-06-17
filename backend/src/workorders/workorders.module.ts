import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WorkOrdersController } from './workorders.controller';
import { WorkOrdersService } from './workorders.service';
import { WorkOrder, WorkOrderSchema } from '../schemas/workorder.schema';
import { WorkOrderLog, WorkOrderLogSchema } from '../schemas/workorder-log.schema';
import { Event, EventSchema } from '../schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: WorkOrderLog.name, schema: WorkOrderLogSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [WorkOrdersController],
  providers: [WorkOrdersService],
  exports: [WorkOrdersService],
})
export class WorkOrdersModule {}
