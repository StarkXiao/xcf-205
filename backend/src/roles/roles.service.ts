import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {}

  async findAll() {
    return this.roleModel.find().sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const role = await this.roleModel.findById(id);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async create(data: any) {
    const existing = await this.roleModel.findOne({ 
      $or: [{ name: data.name }, { code: data.code }] 
    });
    
    if (existing) {
      throw new BadRequestException('角色名称或编码已存在');
    }

    const role = new this.roleModel(data);
    return role.save();
  }

  async update(id: string, data: any) {
    const role = await this.roleModel.findByIdAndUpdate(id, data, { new: true });
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return role;
  }

  async remove(id: string) {
    const role = await this.roleModel.findByIdAndDelete(id);
    if (!role) {
      throw new NotFoundException('角色不存在');
    }
    return { message: '删除成功' };
  }

  async findByCode(code: string) {
    return this.roleModel.findOne({ code });
  }
}
