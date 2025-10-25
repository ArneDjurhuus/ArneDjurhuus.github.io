
import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { SpacesService } from './spaces.service';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  async findAll() {
    const data = await this.spacesService.findAll();
    return { ok: true, data };
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const space = await this.spacesService.findBySlug(slug);
    if (!space) throw new NotFoundException('Space not found');
    return { ok: true, data: space };
  }
}
