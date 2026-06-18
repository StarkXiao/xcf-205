import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';
import { Street, StreetSchema } from '../schemas/street.schema';
import { Community, CommunitySchema } from '../schemas/community.schema';
import { Grid, GridSchema } from '../schemas/grid.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Street.name, schema: StreetSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: Grid.name, schema: GridSchema },
    ]),
  ],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
