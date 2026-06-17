import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Knowledge, KnowledgeDocument } from '../schemas/knowledge.schema';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectModel(Knowledge.name)
    private knowledgeModel: Model<KnowledgeDocument>,
  ) {}

  private buildVisibleRoleFilter(roleId?: string): FilterQuery<KnowledgeDocument> {
    if (!roleId) {
      return {};
    }
    return {
      $or: [
        { visibleRoles: { $size: 0 } },
        { visibleRoles: { $in: [new Types.ObjectId(roleId)] } },
      ],
    };
  }

  private checkVisiblePermission(
    knowledge: KnowledgeDocument,
    roleId?: string,
  ) {
    if (!roleId) {
      return;
    }
    const visibleRoles = knowledge.visibleRoles || [];
    if (visibleRoles.length === 0) {
      return;
    }
    const hasPermission = visibleRoles.some((r) => {
      const idStr = r instanceof Types.ObjectId ? r.toString() : String(r);
      return idStr === String(roleId);
    });
    if (!hasPermission) {
      throw new ForbiddenException('您无权限访问该知识条目');
    }
  }

  async findAll(query: any = {}) {
    const {
      type,
      eventCategory,
      tag,
      keyword,
      roleId,
      page = 1,
      pageSize = 10,
    } = query;
    const filter: FilterQuery<KnowledgeDocument> = { isActive: true };
    const andConditions: FilterQuery<KnowledgeDocument>[] = [];

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
      andConditions.push({
        $or: [
          { title: { $regex: keyword, $options: 'i' } },
          { content: { $regex: keyword, $options: 'i' } },
        ],
      });
    }

    const roleFilter = this.buildVisibleRoleFilter(roleId);
    if (Object.keys(roleFilter).length > 0) {
      andConditions.push(roleFilter);
    }

    if (andConditions.length > 0) {
      filter.$and = andConditions;
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

  async findOne(id: string, roleId?: string) {
    const knowledge = await this.knowledgeModel
      .findById(id)
      .populate('visibleRoles', 'name code')
      .populate('createdBy', 'realName username');
    if (!knowledge) {
      throw new NotFoundException('知识库条目不存在');
    }
    this.checkVisiblePermission(knowledge, roleId);
    return knowledge;
  }

  async create(data: any) {
    const knowledge = new this.knowledgeModel(data);
    return knowledge.save();
  }

  async update(id: string, data: any) {
    const knowledge = await this.knowledgeModel.findByIdAndUpdate(
      id,
      data,
      { new: true },
    );
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

  async incrementReference(id: string, roleId?: string) {
    const knowledge = await this.knowledgeModel.findById(id);
    if (!knowledge) {
      throw new NotFoundException('知识库条目不存在');
    }
    this.checkVisiblePermission(knowledge, roleId);
    knowledge.referenceCount += 1;
    await knowledge.save();
    await this.knowledgeModel.populate(knowledge, [
      { path: 'visibleRoles', select: 'name code' },
      { path: 'createdBy', select: 'realName username' },
    ]);
    return knowledge;
  }

  async findByEventCategory(category: string, roleId?: string) {
    const andConditions: FilterQuery<KnowledgeDocument>[] = [
      { isActive: true, eventCategory: category },
    ];
    const roleFilter = this.buildVisibleRoleFilter(roleId);
    if (Object.keys(roleFilter).length > 0) {
      andConditions.push(roleFilter);
    }
    return this.knowledgeModel
      .find({ $and: andConditions })
      .populate('visibleRoles', 'name code')
      .sort({ createdAt: -1 });
  }

  async getStats(roleId?: string) {
    const andConditions: FilterQuery<KnowledgeDocument>[] = [
      { isActive: true },
    ];
    const roleFilter = this.buildVisibleRoleFilter(roleId);
    if (Object.keys(roleFilter).length > 0) {
      andConditions.push(roleFilter);
    }
    const match = { $match: { $and: andConditions } } as any;

    const total = await this.knowledgeModel.countDocuments({
      $and: andConditions,
    });
    const byType = await this.knowledgeModel.aggregate([
      match,
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const totalReferences = await this.knowledgeModel.aggregate([
      match,
      { $group: { _id: null, total: { $sum: '$referenceCount' } } },
    ]);
    return {
      total,
      byType: byType.reduce(
        (acc, item) => ({ ...acc, [item._id]: item.count }),
        {},
      ),
      totalReferences: totalReferences[0]?.total || 0,
    };
  }
}
