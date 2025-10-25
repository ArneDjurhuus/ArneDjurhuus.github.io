import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SpacesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.space.findMany();
  }
}
