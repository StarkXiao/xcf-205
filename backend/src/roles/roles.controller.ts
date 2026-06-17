import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('roles')
@UseGuards(AuthGuard('jwt'))
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  async create(@Body() body: any) {
    return this.rolesService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.rolesService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
