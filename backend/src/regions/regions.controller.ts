import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RegionsService } from './regions.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('regions')
@UseGuards(AuthGuard('jwt'))
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get('streets')
  async getStreets(@Query() query: any) {
    return this.regionsService.getStreets(query);
  }

  @Get('streets/all')
  async getAllStreets() {
    return this.regionsService.getAllStreets();
  }

  @Get('streets/:id')
  async getStreet(@Param('id') id: string) {
    return this.regionsService.getStreet(id);
  }

  @Post('streets')
  async createStreet(@Body() body: any) {
    return this.regionsService.createStreet(body);
  }

  @Put('streets/:id')
  async updateStreet(@Param('id') id: string, @Body() body: any) {
    return this.regionsService.updateStreet(id, body);
  }

  @Delete('streets/:id')
  async deleteStreet(@Param('id') id: string) {
    return this.regionsService.deleteStreet(id);
  }

  @Get('communities')
  async getCommunities(@Query() query: any) {
    return this.regionsService.getCommunities(query);
  }

  @Get('communities/by-street/:streetId')
  async getCommunitiesByStreet(@Param('streetId') streetId: string) {
    return this.regionsService.getCommunitiesByStreet(streetId);
  }

  @Get('communities/:id')
  async getCommunity(@Param('id') id: string) {
    return this.regionsService.getCommunity(id);
  }

  @Post('communities')
  async createCommunity(@Body() body: any) {
    return this.regionsService.createCommunity(body);
  }

  @Put('communities/:id')
  async updateCommunity(@Param('id') id: string, @Body() body: any) {
    return this.regionsService.updateCommunity(id, body);
  }

  @Delete('communities/:id')
  async deleteCommunity(@Param('id') id: string) {
    return this.regionsService.deleteCommunity(id);
  }

  @Get('grids')
  async getGrids(@Query() query: any) {
    return this.regionsService.getGrids(query);
  }

  @Get('grids/by-community/:communityId')
  async getGridsByCommunity(@Param('communityId') communityId: string) {
    return this.regionsService.getGridsByCommunity(communityId);
  }

  @Get('grids/:id')
  async getGrid(@Param('id') id: string) {
    return this.regionsService.getGrid(id);
  }

  @Post('grids')
  async createGrid(@Body() body: any) {
    return this.regionsService.createGrid(body);
  }

  @Put('grids/:id')
  async updateGrid(@Param('id') id: string, @Body() body: any) {
    return this.regionsService.updateGrid(id, body);
  }

  @Delete('grids/:id')
  async deleteGrid(@Param('id') id: string) {
    return this.regionsService.deleteGrid(id);
  }

  @Get('tree')
  async getRegionTree() {
    return this.regionsService.getRegionTree();
  }

  @Get('stats')
  async getRegionStats() {
    return this.regionsService.getRegionStats();
  }
}
