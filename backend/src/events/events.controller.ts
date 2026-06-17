import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { EventsService } from './events.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Query() query: any) {
    return this.eventsService.findAll(query);
  }

  @Get('map')
  async findAllForMap(@Query() query: any) {
    return this.eventsService.findAllForMap(query);
  }

  @Get('statistics')
  async getStatistics() {
    return this.eventsService.getStatistics();
  }

  @Get('trend')
  async getTrend(@Query('days') days: number) {
    return this.eventsService.getTrend(days || 30);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.eventsService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() body: any) {
    return this.eventsService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'))
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; handlerId?: string; handlerName?: string },
  ) {
    return this.eventsService.updateStatus(id, body.status as any, body.handlerId, body.handlerName);
  }
}
