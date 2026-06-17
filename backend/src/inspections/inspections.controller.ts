import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('inspection')
@UseGuards(AuthGuard('jwt'))
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Get('statistics')
  async getStatistics() {
    return this.inspectionsService.getStatistics();
  }

  @Get('plans')
  async findAllPlans(@Query() query: any) {
    return this.inspectionsService.findAllPlans(query);
  }

  @Get('plans/:id')
  async findPlan(@Param('id') id: string) {
    return this.inspectionsService.findPlan(id);
  }

  @Post('plans')
  async createPlan(@Body() body: any) {
    return this.inspectionsService.createPlan(body);
  }

  @Put('plans/:id')
  async updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.inspectionsService.updatePlan(id, body);
  }

  @Delete('plans/:id')
  async removePlan(@Param('id') id: string) {
    return this.inspectionsService.removePlan(id);
  }

  @Get('tasks')
  async findAllTasks(@Query() query: any) {
    return this.inspectionsService.findAllTasks(query);
  }

  @Get('tasks/:id')
  async findTask(@Param('id') id: string) {
    return this.inspectionsService.findTask(id);
  }

  @Put('tasks/:id/start')
  async startTask(@Param('id') id: string) {
    return this.inspectionsService.startTask(id);
  }

  @Post('tasks/:id/checkin')
  async checkin(@Param('id') id: string, @Body() body: any) {
    return this.inspectionsService.checkin(id, body);
  }

  @Put('tasks/:id/complete')
  async completeTask(@Param('id') id: string) {
    return this.inspectionsService.completeTask(id);
  }

  @Get('exceptions')
  async findAllExceptions(@Query() query: any) {
    return this.inspectionsService.findAllExceptions(query);
  }

  @Post('exceptions')
  async reportException(@Body() body: any) {
    return this.inspectionsService.reportException(body);
  }

  @Post('exceptions/:id/create-event')
  async createEventFromException(@Param('id') id: string, @Body() body: any) {
    return this.inspectionsService.createEventFromException(id, body);
  }
}
