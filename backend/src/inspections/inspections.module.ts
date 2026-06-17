import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';
import {
  InspectionPlan,
  InspectionPlanSchema,
  InspectionTask,
  InspectionTaskSchema,
  InspectionException,
  InspectionExceptionSchema,
} from '../schemas/inspection.schema';
import { Event, EventSchema } from '../schemas/event.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InspectionPlan.name, schema: InspectionPlanSchema },
      { name: InspectionTask.name, schema: InspectionTaskSchema },
      { name: InspectionException.name, schema: InspectionExceptionSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [InspectionsController],
  providers: [InspectionsService],
  exports: [InspectionsService],
})
export class InspectionsModule {}
