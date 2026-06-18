import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Dictionary, DictionaryDocument, DictionaryType } from '../schemas/dictionary.schema';

@Injectable()
export class DictionariesService {
  constructor(@InjectModel(Dictionary.name) private dictionaryModel: Model<DictionaryDocument>) {}

  async findAll(query: any = {}) {
    const { type, isActive } = query;
    const filter: any = {};
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive;

    return this.dictionaryModel.find(filter).sort({ type: 1, sort: 1, createdAt: -1 });
  }

  async findByType(type: DictionaryType, onlyActive: boolean = true) {
    const filter: any = { type };
    if (onlyActive) filter.isActive = true;
    return this.dictionaryModel.find(filter).sort({ sort: 1, createdAt: 1 });
  }

  async findOne(id: string) {
    const dictionary = await this.dictionaryModel.findById(id);
    if (!dictionary) {
      throw new NotFoundException('字典项不存在');
    }
    return dictionary;
  }

  async create(data: any) {
    const existing = await this.dictionaryModel.findOne({
      type: data.type,
      code: data.code,
    });
    
    if (existing) {
      throw new BadRequestException('该类型下字典编码已存在');
    }

    const dictionary = new this.dictionaryModel(data);
    return dictionary.save();
  }

  async update(id: string, data: any) {
    const dictionary = await this.dictionaryModel.findById(id);
    if (!dictionary) {
      throw new NotFoundException('字典项不存在');
    }

    if (data.code && data.code !== dictionary.code) {
      const existing = await this.dictionaryModel.findOne({
        type: data.type || dictionary.type,
        code: data.code,
        _id: { $ne: id },
      });
      if (existing) {
        throw new BadRequestException('该类型下字典编码已存在');
      }
    }

    return this.dictionaryModel.findByIdAndUpdate(id, data, { new: true });
  }

  async remove(id: string) {
    const dictionary = await this.dictionaryModel.findByIdAndDelete(id);
    if (!dictionary) {
      throw new NotFoundException('字典项不存在');
    }
    return { message: '删除成功' };
  }

  async getDictionaryMap(type: DictionaryType): Promise<Record<string, string>> {
    const items = await this.findByType(type);
    const map: Record<string, string> = {};
    items.forEach(item => {
      map[item.code] = item.name;
    });
    return map;
  }
}
