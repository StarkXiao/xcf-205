import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Knowledge, KnowledgeDocument, KnowledgeType } from '../schemas/knowledge.schema';

@Injectable()
export class KnowledgeService {
  constructor(@InjectModel(Knowledge.name) private knowledgeModel: Model<KnowledgeDocument>) {}

  async findAll(query: any = {}) {
    const { type, eventCategory, tag, keyword, roleId, page = 1, pageSize = 10 } = query;
    const filter: any = { isActive: true };

    if (type) {
      filter.type = type;
    }
    if (eventCategory) {
      filter.eventCategory = eventCategory;
    }
    if (tag) {
      filter.tags = { $in: [tag] };
    }
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { content: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (roleId) {
      filter.$or = [
        { visibleRoles: { $size: 0 } },
        { visibleRoles: { $in: [new Types.ObjectId(roleId)] } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.knowledgeModel
        .find(filter)
        .populate('visibleRoles', 'name code')
        .populate('createdBy', 'realName username')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      this.knowledgeModel.countDocuments(filter),
    ]);

    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOne(id: string) {
    const knowledge = await this.knowledgeModel
      .findById(id)
      .populate('visibleRoles', 'name code')
      .populate('createdBy', 'realName username');
    if (!knowledge) {
      throw new NotFoundException('知识库条目不存在');
    }
    return knowledge;
  }

  async create(data: any) {
    const knowledge = new this.knowledgeModel(data);
    return knowledge.save();
  }

  async update(id: string, data: any) {
    const knowledge = await this.knowledgeModel.findByIdAndUpdate(id, data, { new: true });
    if (!knowledge) {
      throw new NotFoundException('知识库条目不存在');
    }
    return knowledge;
  }

  async remove(id: string) {
    const knowledge = await this.knowledgeModel.findByIdAndDelete(id);
    if (!knowledge) {
      throw new NotFoundException('知识库条目不存在');
    }
    return { message: '删除成功' };
  }

  async incrementReference(id: string) {
    const knowledge = await this.knowledgeModel.findByIdAndUpdate(
      id,
      { $inc: { referenceCount: 1 } },
      { new: true },
    );
    if (!knowledge) {
      throw new NotFoundException('知识库条目不存在');
    }
    return knowledge;
  }

  async findByEventCategory(category: string, roleId?: string) {
    const filter: any = {
      isActive: true,
      eventCategory: category,
    };
    if (roleId) {
      filter.$or = [
        { visibleRoles: { $size: 0 } },
        { visibleRoles: { $in: [new Types.ObjectId(roleId)] } },
      ];
    }
    return this.knowledgeModel
      .find(filter)
      .populate('visibleRoles', 'name code')
      .sort({ createdAt: -1 });
  }

  async getStats() {
    const total = await this.knowledgeModel.countDocuments({ isActive: true });
    const byType = await this.knowledgeModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const totalReferences = await this.knowledgeModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$referenceCount' } } },
    ]);
    return {
      total,
      byType: byType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      totalReferences: totalReferences[0]?.total || 0,
    };
  }
}
