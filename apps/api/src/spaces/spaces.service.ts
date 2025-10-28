import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.space.findMany();
  }

  findBySlug(slug: string) {
    return this.prisma.space.findUnique({ where: { slug } });
  }

  async findNotesBySpaceSlug(slug: string) {
    const space = await this.prisma.space.findUnique({ where: { slug } });
    if (!space) return null;
    return this.prisma.note.findMany({ where: { spaceId: space.id }, orderBy: { title: 'asc' } });
  }

  async createNoteBySpaceSlug(slug: string, title?: string) {
    const space = await this.prisma.space.findUnique({ where: { slug } });
    if (!space) return null;
    // Generate a stable ydocId
    const { randomUUID } = await import('crypto');
    const ydocId = `note-${randomUUID()}`;
    const note = await this.prisma.note.create({
      data: {
        spaceId: space.id,
        title: title && title.trim().length > 0 ? title.trim() : 'Untitled',
        ydocId,
      },
    });
    return note;
  }

  async updateNoteTitle(slug: string, id: string, title: string) {
    const space = await this.prisma.space.findUnique({ where: { slug } });
    if (!space) return null;
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note || note.spaceId !== space.id) return null;
    return this.prisma.note.update({ where: { id }, data: { title } });
  }

  async deleteNote(slug: string, id: string) {
    const space = await this.prisma.space.findUnique({ where: { slug } });
    if (!space) return null;
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note || note.spaceId !== space.id) return null;
    await this.prisma.note.delete({ where: { id } });
    return { id };
  }
}
