import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('performance')
@UseGuards(AuthGuard('jwt'))
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('ranking')
  async getDepartmentRanking(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    return this.performanceService.getDepartmentRanking(targetYear, targetMonth);
  }

  @Get('summary')
  async getMonthlySummary(
    @Query('year') year: number,
    @Query('month') month: number,
  ) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    return this.performanceService.getMonthlySummary(targetYear, targetMonth);
  }

  @Get('workorders')
  async getWorkOrderDetailReport(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('department') department?: string,
  ) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    return this.performanceService.getWorkOrderDetailReport(targetYear, targetMonth, department);
  }

  @Get('events')
  async getEventDetailReport(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('department') department?: string,
  ) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    return this.performanceService.getEventDetailReport(targetYear, targetMonth, department);
  }

  @Get('inspections')
  async getInspectionDetailReport(
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('department') department?: string,
  ) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;
    return this.performanceService.getInspectionDetailReport(targetYear, targetMonth, department);
  }

  @Get('departments')
  async getDepartmentList() {
    return this.performanceService.getDepartmentList();
  }
}
