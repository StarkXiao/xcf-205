import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('approvals')
@UseGuards(AuthGuard('jwt'))
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('flows')
  async findAllFlows(@Query() query: any) {
    return this.approvalsService.findAllFlows(query);
  }

  @Get('flows/:id')
  async findOneFlow(@Param('id') id: string) {
    return this.approvalsService.findOneFlow(id);
  }

  @Get('flows/type/:type')
  async findFlowByType(@Param('type') type: string) {
    return this.approvalsService.findFlowByType(type as any);
  }

  @Post('flows')
  async createFlow(@Body() body: any) {
    return this.approvalsService.createFlow(body);
  }

  @Put('flows/:id')
  async updateFlow(@Param('id') id: string, @Body() body: any) {
    return this.approvalsService.updateFlow(id, body);
  }

  @Delete('flows/:id')
  async removeFlow(@Param('id') id: string) {
    return this.approvalsService.removeFlow(id);
  }

  @Get('instances')
  async findAllInstances(@Query() query: any) {
    return this.approvalsService.findAllInstances(query);
  }

  @Get('instances/pending-count')
  async getPendingCount(@Query('approverId') approverId: string) {
    const count = await this.approvalsService.getPendingCount(approverId);
    return { count };
  }

  @Get('instances/:id')
  async findOneInstance(@Param('id') id: string) {
    return this.approvalsService.findOneInstance(id);
  }

  @Post('instances')
  async submitApplication(@Body() body: any) {
    return this.approvalsService.submitApplication(body);
  }

  @Put('instances/:id/approve')
  async approveNode(@Param('id') id: string, @Body() body: any) {
    return this.approvalsService.approveNode(id, body);
  }

  @Put('instances/:id/reject')
  async rejectNode(@Param('id') id: string, @Body() body: any) {
    return this.approvalsService.rejectNode(id, body);
  }

  @Put('instances/:id/cancel')
  async cancelInstance(@Param('id') id: string, @Body() body: any) {
    return this.approvalsService.cancelInstance(id, body);
  }

  @Get('instances/:id/logs')
  async getLogs(@Param('id') id: string) {
    return this.approvalsService.getLogs(id);
  }
}
