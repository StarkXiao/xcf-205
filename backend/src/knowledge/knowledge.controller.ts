import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('knowledge')
@UseGuards(AuthGuard('jwt'))
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Get()
  async findAll(@Query() query: any, @Req() req: any) {
    return this.knowledgeService.findAll({
      ...query,
      roleId: req.user?.roleId?._id || req.user?.roleId,
    });
  }

  @Get('stats')
  async getStats() {
    return this.knowledgeService.getStats();
  }

  @Get('category/:category')
  async findByEventCategory(
    @Param('category') category: string,
    @Req() req: any,
  ) {
    return this.knowledgeService.findByEventCategory(
      category,
      req.user?.roleId?._id || req.user?.roleId,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.knowledgeService.findOne(id);
  }

  @Post()
  async create(@Body() body: any, @Req() req: any) {
    return this.knowledgeService.create({
      ...body,
      createdBy: req.user?._id,
    });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.knowledgeService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.knowledgeService.remove(id);
  }

  @Put(':id/reference')
  async incrementReference(@Param('id') id: string) {
    return this.knowledgeService.incrementReference(id);
  }
}
