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
}
