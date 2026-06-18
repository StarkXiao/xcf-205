import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DictionariesService } from './dictionaries.service';
import { AuthGuard } from '@nestjs/passport';
import { DictionaryType } from '../schemas/dictionary.schema';

@Controller('dictionaries')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Query() query: any) {
    return this.dictionariesService.findAll(query);
  }

  @Get('type/:type')
  async findByType(@Param('type') type: DictionaryType, @Query('all') all: string) {
    return this.dictionariesService.findByType(type, all !== 'true');
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.dictionariesService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: any) {
    return this.dictionariesService.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() body: any) {
    return this.dictionariesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    return this.dictionariesService.remove(id);
  }
}
