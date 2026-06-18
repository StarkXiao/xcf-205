import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Event, EventSchema } from '../schemas/event.schema';
import { WorkOrder, WorkOrderSchema } from '../schemas/workorder.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Dictionary, DictionarySchema } from '../schemas/dictionary.schema';
import { DictionariesModule } from '../dictionaries/dictionaries.module';
import { RegionsModule } from '../regions/regions.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: WorkOrder.name, schema: WorkOrderSchema },
      { name: User.name, schema: UserSchema },
      { name: Dictionary.name, schema: DictionarySchema },
    ]),
    DictionariesModule,
    RegionsModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
})
export class StatisticsModule {}
