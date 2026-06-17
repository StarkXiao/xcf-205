import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { Event, EventSchema } from '../schemas/event.schema';
import { WorkOrder, WorkOrderSchema } from '../schemas/workorder.schema';
import { InspectionTask, InspectionTaskSchema } from '../schemas/inspection.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: InspectionTask.name, schema: InspectionTaskSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
})
export class PerformanceModule {}
