import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '../schemas/notification.schema';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Request() req, @Query() query: any) {
    return this.notificationsService.findAll(req.user._id, query);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.notificationsService.getStats(req.user._id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const notification = await this.notificationsService.findOne(id, req.user._id);
    if (notification.status === 'unread') {
      return this.notificationsService.markAsRead(id, req.user._id);
    }
    return notification;
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationsService.markAsRead(id, req.user._id);
  }

  @Put('read-all')
  async markAllAsRead(@Request() req, @Body('type') type?: NotificationType) {
    return this.notificationsService.markAllAsRead(req.user._id, type);
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id') id: string) {
    return this.notificationsService.remove(id, req.user._id);
  }

  @Delete('clear-all')
  async clearAll(@Request() req, @Query('type') type?: NotificationType) {
    return this.notificationsService.clearAll(req.user._id, type);
  }
}
