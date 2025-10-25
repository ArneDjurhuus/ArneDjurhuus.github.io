import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  async getBySpace(@Query('spaceId') spaceId: string) {
    if (!spaceId) {
      return { ok: false, error: 'spaceId is required' };
    }
    const data = await this.tasks.listBySpace(spaceId);
    return { ok: true, data };
  }

  @Post()
  async create(@Body() dto: CreateTaskDto) {
    const data = await this.tasks.create(dto);
    return { ok: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    const data = await this.tasks.update(id, dto);
    return { ok: true, data };
  }
}
