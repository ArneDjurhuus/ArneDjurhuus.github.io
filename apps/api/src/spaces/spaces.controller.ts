
import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { SpacesService } from './spaces.service';
import { CreateNoteDto } from './dto/create-note.dto';

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

  @Get(':slug/notes')
  async listNotes(@Param('slug') slug: string) {
    const notes = await this.spacesService.findNotesBySpaceSlug(slug);
    if (notes === null) throw new NotFoundException('Space not found');
    return { ok: true, data: notes };
  }

  @Post(':slug/notes')
  async createNote(@Param('slug') slug: string, @Body() body: CreateNoteDto) {
    const note = await this.spacesService.createNoteBySpaceSlug(slug, body?.title);
    if (note === null) throw new NotFoundException('Space not found');
    return { ok: true, data: note };
  }
}
