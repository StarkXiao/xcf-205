import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Knowledge, KnowledgeSchema } from '../schemas/knowledge.schema';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Knowledge.name, schema: KnowledgeSchema }]),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
