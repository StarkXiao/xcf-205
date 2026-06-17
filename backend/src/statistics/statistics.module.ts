import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Event, EventSchema } from '../schemas/event.schema';
import { WorkOrder, WorkOrderSchema } from '../schemas/workorder.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
