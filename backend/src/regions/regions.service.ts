import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Street } from '../schemas/street.schema';
import { Community } from '../schemas/community.schema';
import { Grid } from '../schemas/grid.schema';

@Injectable()
export class RegionsService {
  constructor(
    @InjectModel(Street.name) private streetModel: Model<any>,
    @InjectModel(Community.name) private communityModel: Model<any>,
    @InjectModel(Grid.name) private gridModel: Model<any>,
  ) {}

  async getStreets(query: any = {}) {
    const { page = 1, pageSize = 10, keyword, isActive } = query;
    const filter: any = {};
    
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.streetModel.find(filter).sort({ sort: 1, createdAt: -1 }).skip(skip).limit(parseInt(pageSize)),
      this.streetModel.countDocuments(filter),
    ]);

    return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  async getAllStreets() {
    return this.streetModel.find({ isActive: true }).sort({ sort: 1, name: 1 });
  }

  async getStreet(id: string) {
    return this.streetModel.findById(id);
  }

  async createStreet(data: any) {
    const street = new this.streetModel(data);
    return street.save();
  }

  async updateStreet(id: string, data: any) {
    return this.streetModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteStreet(id: string) {
    const communityCount = await this.communityModel.countDocuments({ streetId: new Types.ObjectId(id) });
    if (communityCount > 0) {
      throw new Error('该街道下存在社区，无法删除');
    }
    return this.streetModel.findByIdAndDelete(id);
  }

  async getCommunities(query: any = {}) {
    const { page = 1, pageSize = 10, keyword, streetId, isActive } = query;
    const filter: any = {};
    
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (streetId) filter.streetId = new Types.ObjectId(streetId);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.communityModel.find(filter).sort({ sort: 1, createdAt: -1 }).skip(skip).limit(parseInt(pageSize)),
      this.communityModel.countDocuments(filter),
    ]);

    return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  async getCommunitiesByStreet(streetId: string) {
    const filter: any = { isActive: true };
    if (streetId && streetId !== 'all') {
      filter.streetId = new Types.ObjectId(streetId);
    }
    return this.communityModel.find(filter).sort({ sort: 1, name: 1 });
  }

  async getCommunity(id: string) {
    return this.communityModel.findById(id);
  }

  async createCommunity(data: any) {
    const street = await this.streetModel.findById(data.streetId);
    if (street) {
      data.streetName = street.name;
      data.streetCode = street.code;
    }
    const community = new this.communityModel(data);
    return community.save();
  }

  async updateCommunity(id: string, data: any) {
    if (data.streetId) {
      const street = await this.streetModel.findById(data.streetId);
      if (street) {
        data.streetName = street.name;
        data.streetCode = street.code;
      }
    }
    return this.communityModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteCommunity(id: string) {
    const gridCount = await this.gridModel.countDocuments({ communityId: new Types.ObjectId(id) });
    if (gridCount > 0) {
      throw new Error('该社区下存在网格，无法删除');
    }
    return this.communityModel.findByIdAndDelete(id);
  }

  async getGrids(query: any = {}) {
    const { page = 1, pageSize = 10, keyword, streetId, communityId, isActive } = query;
    const filter: any = {};
    
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (streetId) filter.streetId = new Types.ObjectId(streetId);
    if (communityId) filter.communityId = new Types.ObjectId(communityId);
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * pageSize;
    const [list, total] = await Promise.all([
      this.gridModel.find(filter).sort({ sort: 1, createdAt: -1 }).skip(skip).limit(parseInt(pageSize)),
      this.gridModel.countDocuments(filter),
    ]);

    return { list, total, page: parseInt(page), pageSize: parseInt(pageSize) };
  }

  async getGridsByCommunity(communityId: string) {
    const filter: any = { isActive: true };
    if (communityId && communityId !== 'all') {
      filter.communityId = new Types.ObjectId(communityId);
    }
    return this.gridModel.find(filter).sort({ sort: 1, name: 1 });
  }

  async getGrid(id: string) {
    return this.gridModel.findById(id);
  }

  async createGrid(data: any) {
    const community = await this.communityModel.findById(data.communityId);
    if (community) {
      data.communityName = community.name;
      data.communityCode = community.code;
      data.streetId = community.streetId;
      data.streetName = community.streetName;
      data.streetCode = community.streetCode;
    }
    const grid = new this.gridModel(data);
    return grid.save();
  }

  async updateGrid(id: string, data: any) {
    if (data.communityId) {
      const community = await this.communityModel.findById(data.communityId);
      if (community) {
        data.communityName = community.name;
        data.communityCode = community.code;
        data.streetId = community.streetId;
        data.streetName = community.streetName;
        data.streetCode = community.streetCode;
      }
    }
    return this.gridModel.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteGrid(id: string) {
    return this.gridModel.findByIdAndDelete(id);
  }

  async getRegionTree() {
    const streets = await this.streetModel.find({ isActive: true }).sort({ sort: 1, name: 1 });
    const communities = await this.communityModel.find({ isActive: true }).sort({ sort: 1, name: 1 });
    const grids = await this.gridModel.find({ isActive: true }).sort({ sort: 1, name: 1 });

    const communityMap = new Map<string, any[]>();
    communities.forEach(c => {
      const streetId = c.streetId.toString();
      if (!communityMap.has(streetId)) {
        communityMap.set(streetId, []);
      }
      communityMap.get(streetId)!.push(c.toObject());
    });

    const gridMap = new Map<string, any[]>();
    grids.forEach(g => {
      const communityId = g.communityId.toString();
      if (!gridMap.has(communityId)) {
        gridMap.set(communityId, []);
      }
      gridMap.get(communityId)!.push(g.toObject());
    });

    const tree = streets.map(street => {
      const streetObj = street.toObject();
      const streetCommunities = communityMap.get(street._id.toString()) || [];
      streetObj.children = streetCommunities.map(community => {
        community.children = gridMap.get(community._id.toString()) || [];
        return community;
      });
      return streetObj;
    });

    return tree;
  }

  async getRegionStats() {
    const [streetCount, communityCount, gridCount] = await Promise.all([
      this.streetModel.countDocuments({ isActive: true }),
      this.communityModel.countDocuments({ isActive: true }),
      this.gridModel.countDocuments({ isActive: true }),
    ]);

    const streetStats = await this.streetModel.aggregate([
      {
        $lookup: {
          from: 'communities',
          localField: '_id',
          foreignField: 'streetId',
          as: 'communities',
        },
      },
      {
        $lookup: {
          from: 'grids',
          localField: '_id',
          foreignField: 'streetId',
          as: 'grids',
        },
      },
      {
        $project: {
          _id: 1,
          code: 1,
          name: 1,
          communityCount: { $size: '$communities' },
          gridCount: { $size: '$grids' },
        },
      },
      { $sort: { sort: 1, name: 1 } },
    ]);

    return {
      total: {
        streets: streetCount,
        communities: communityCount,
        grids: gridCount,
      },
      streetStats,
    };
  }
}
