import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { Event, EventSchema } from '../schemas/event.schema';
import { WorkOrder, WorkOrderSchema } from '../schemas/workorder.schema';
import { WorkOrderLog, WorkOrderLogSchema } from '../schemas/workorder-log.schema';
import { InspectionTask, InspectionTaskSchema } from '../schemas/inspection.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Dictionary, DictionarySchema } from '../schemas/dictionary.schema';
import { DictionariesModule } from '../dictionaries/dictionaries.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: WorkOrderLog.name, schema: WorkOrderLogSchema },
      { name: InspectionTask.name, schema: InspectionTaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Dictionary.name, schema: DictionarySchema },
    ]),
    DictionariesModule,
  ],
  controllers: [PerformanceController],
  providers: [PerformanceService],
})
export class PerformanceModule {}
