import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attachment, AttachmentDocument, AttachmentStatus, AttachmentType } from '../schemas/attachment.schema';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectModel(Attachment.name) private attachmentModel: Model<AttachmentDocument>,
  ) {}

  async findAll(query: any = {}) {
    const {
      page = 1,
      pageSize = 10,
      type,
      status,
      relatedId,
      relatedModel,
      keyword,
      tags,
      startDate,
      endDate,
    } = query;

    const filter: any = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (relatedId) filter.relatedId = new Types.ObjectId(relatedId);
    if (relatedModel) filter.relatedModel = relatedModel;
    if (keyword) {
      filter.$or = [
        { originalName: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { relatedNo: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (tags && tags.length > 0) {
      filter.tags = { $in: Array.isArray(tags) ? tags : tags.split(',') };
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const total = await this.attachmentModel.countDocuments(filter);
    const list = await this.attachmentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(pageSize));

    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findOne(id: string) {
    const attachment = await this.attachmentModel.findById(id);
    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }
    return attachment;
  }

  async create(createDto: {
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    type: AttachmentType;
    relatedId?: string;
    relatedModel?: string;
    relatedNo?: string;
    description?: string;
    tags?: string[];
    uploadedBy?: string;
    uploadedByName?: string;
  }) {
    const attachment = new this.attachmentModel({
      ...createDto,
      relatedId: createDto.relatedId ? new Types.ObjectId(createDto.relatedId) : undefined,
      uploadedBy: createDto.uploadedBy ? new Types.ObjectId(createDto.uploadedBy) : undefined,
    });
    return attachment.save();
  }

  async batchCreate(attachments: any[]) {
    const docs = attachments.map((a) => ({
      ...a,
      relatedId: a.relatedId ? new Types.ObjectId(a.relatedId) : undefined,
      uploadedBy: a.uploadedBy ? new Types.ObjectId(a.uploadedBy) : undefined,
    }));
    return this.attachmentModel.insertMany(docs);
  }

  async update(id: string, updateDto: {
    originalName?: string;
    description?: string;
    tags?: string[];
    type?: AttachmentType;
  }) {
    const attachment = await this.attachmentModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );
    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }
    return attachment;
  }

  async remove(id: string, softDelete = true) {
    if (softDelete) {
      const attachment = await this.attachmentModel.findByIdAndUpdate(
        id,
        { $set: { status: AttachmentStatus.DELETED } },
        { new: true },
      );
      if (!attachment) {
        throw new NotFoundException('附件不存在');
      }
      return attachment;
    } else {
      const attachment = await this.attachmentModel.findByIdAndDelete(id);
      if (!attachment) {
        throw new NotFoundException('附件不存在');
      }
      return attachment;
    }
  }

  async archive(id: string, archivedBy?: string, archivedByName?: string) {
    const attachment = await this.attachmentModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: AttachmentStatus.ARCHIVED,
          archivedBy: archivedBy ? new Types.ObjectId(archivedBy) : undefined,
          archivedByName,
          archivedAt: new Date(),
        },
      },
      { new: true },
    );
    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }
    return attachment;
  }

  async batchArchive(ids: string[], archivedBy?: string, archivedByName?: string) {
    const result = await this.attachmentModel.updateMany(
      { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } },
      {
        $set: {
          status: AttachmentStatus.ARCHIVED,
          archivedBy: archivedBy ? new Types.ObjectId(archivedBy) : undefined,
          archivedByName,
          archivedAt: new Date(),
        },
      },
    );
    return { modifiedCount: result.modifiedCount };
  }

  async restore(id: string) {
    const attachment = await this.attachmentModel.findByIdAndUpdate(
      id,
      {
        $set: { status: AttachmentStatus.NORMAL },
        $unset: { archivedBy: 1, archivedByName: 1, archivedAt: 1 },
      },
      { new: true },
    );
    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }
    return attachment;
  }

  async findByRelated(relatedId: string, relatedModel?: string, type?: AttachmentType) {
    const filter: any = { relatedId: new Types.ObjectId(relatedId) };
    if (relatedModel) filter.relatedModel = relatedModel;
    if (type) filter.type = type;
    return this.attachmentModel.find(filter).sort({ createdAt: -1 });
  }

  async getStatistics() {
    const total = await this.attachmentModel.countDocuments();
    const byType = await this.attachmentModel.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    const byStatus = await this.attachmentModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const byMonth = await this.attachmentModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          size: { $sum: '$fileSize' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    const formatByType: Record<string, number> = {};
    byType.forEach((item) => {
      formatByType[item._id] = item.count;
    });

    const formatByStatus: Record<string, number> = {};
    byStatus.forEach((item) => {
      formatByStatus[item._id] = item.count;
    });

    return {
      total,
      byType: formatByType,
      byStatus: formatByStatus,
      byMonth,
    };
  }
}
