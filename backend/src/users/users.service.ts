import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(query: any = {}) {
    const { page = 1, pageSize = 10, keyword, roleId, isActive } = query;
    const filter: any = {};
    
    if (keyword) {
      filter.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { realName: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
      ];
    }
    
    if (roleId) filter.roleId = roleId;
    if (isActive !== undefined) filter.isActive = isActive;

    const users = await this.userModel
      .find(filter)
      .populate('roleId')
      .select('-password')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const total = await this.userModel.countDocuments(filter);

    return {
      list: users,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    };
  }

  async findOne(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate('roleId')
      .select('-password');
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async create(data: any) {
    const existing = await this.userModel.findOne({ username: data.username });
    if (existing) {
      throw new BadRequestException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(data.password || '123456', 10);
    
    const user = new this.userModel({
      ...data,
      password: hashedPassword,
    });
    
    await user.save();
    const result = await user.populate('roleId');
    const userObj = result.toObject();
    delete userObj.password;
    return userObj;
  }

  async update(id: string, data: any) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
    }

    const updated = await this.userModel
      .findByIdAndUpdate(id, data, { new: true })
      .populate('roleId')
      .select('-password');
    
    return updated;
  }

  async remove(id: string) {
    const user = await this.userModel.findByIdAndDelete(id);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return { message: '删除成功' };
  }

  async findByRole(roleCode: string) {
    const users = await this.userModel
      .find()
      .populate({
        path: 'roleId',
        match: { code: roleCode },
      })
      .select('-password');
    
    return users.filter(u => u.roleId);
  }
}
