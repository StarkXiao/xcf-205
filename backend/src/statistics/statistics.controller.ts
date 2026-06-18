import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('statistics')
@UseGuards(AuthGuard('jwt'))
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('overview')
  async getOverview() {
    return this.statisticsService.getOverview();
  }

  @Get('event-category')
  async getEventCategoryStats() {
    return this.statisticsService.getEventCategoryStats();
  }

  @Get('event-status')
  async getEventStatusStats() {
    return this.statisticsService.getEventStatusStats();
  }

  @Get('workorder-status')
  async getWorkOrderStatusStats() {
    return this.statisticsService.getWorkOrderStatusStats();
  }

  @Get('trend')
  async getTrend(@Query('days') days: number) {
    return this.statisticsService.getTrend(days || 30);
  }

  @Get('department')
  async getDepartmentStats() {
    return this.statisticsService.getDepartmentStats();
  }

  @Get('priority')
  async getPriorityStats() {
    return this.statisticsService.getPriorityStats();
  }

  @Get('handler-ranking')
  async getHandlerRanking() {
    return this.statisticsService.getHandlerRanking();
  }

  @Get('event-by-street')
  async getEventByStreet() {
    return this.statisticsService.getEventByStreet();
  }

  @Get('event-by-community')
  async getEventByCommunity(@Query('streetId') streetId: string) {
    return this.statisticsService.getEventByCommunity(streetId);
  }

  @Get('event-by-grid')
  async getEventByGrid(@Query('communityId') communityId: string) {
    return this.statisticsService.getEventByGrid(communityId);
  }
}
