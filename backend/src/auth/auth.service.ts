import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async login(username: string, password: string) {
    const user = await this.userModel
      .findOne({ username })
      .populate('roleId');
    
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload = { 
      sub: user._id, 
      username: user.username,
      roleId: user.roleId,
    };
    
    const token = this.jwtService.sign(payload);

    const userData = user.toObject();
    delete userData.password;

    return {
      token,
      user: userData,
    };
  }

  async validateUser(id: string) {
    return this.userModel.findById(id).populate('roleId');
  }
}
