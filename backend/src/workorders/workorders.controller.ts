import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WorkOrdersService } from './workorders.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('workorders')
@UseGuards(AuthGuard('jwt'))
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.workOrdersService.findAll(query);
  }

  @Get('statistics')
  async getStatistics() {
    return this.workOrdersService.getStatistics();
  }

  @Get('department-stats')
  async getDepartmentStats() {
    return this.workOrdersService.getDepartmentStats();
  }

  @Get('trend')
  async getTrend(@Query('days') days: number) {
    return this.workOrdersService.getTrend(days || 30);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workOrdersService.findOne(id);
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    return this.workOrdersService.getLogs(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.workOrdersService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.workOrdersService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.workOrdersService.remove(id);
  }

  @Put(':id/assign')
  async assign(@Param('id') id: string, @Body() body: any) {
    return this.workOrdersService.assign(id, body);
  }

  @Put(':id/start')
  async startProcessing(@Param('id') id: string, @Body() body: any) {
    return this.workOrdersService.startProcessing(id, body);
  }

  @Put(':id/complete')
  async complete(@Param('id') id: string, @Body() body: any) {
    return this.workOrdersService.complete(id, body);
  }

  @Put(':id/verify')
  async verify(@Param('id') id: string, @Body() body: any) {
    return this.workOrdersService.verify(id, body);
  }

  @Put(':id/close')
  async close(@Param('id') id: string, @Body() body: any) {
    return this.workOrdersService.close(id, body);
  }

  @Put(':id/remind')
  async remind(@Param('id') id: string, @Body() body: any) {
    return this.workOrdersService.remind(id, body);
  }
}
