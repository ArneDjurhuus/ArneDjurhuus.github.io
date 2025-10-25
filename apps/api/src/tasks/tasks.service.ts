import { Injectable, NotFoundException } from '@nestjs/common';
import type { TaskStatus } from './dto/create-task.dto';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  listBySpace(spaceId: string) {
    return this.prisma.task.findMany({ where: { spaceId } });
  }

  async create(input: { title: string; spaceId: string; assigneeId?: string; dueAt?: string }) {
    return this.prisma.task.create({
      data: {
        title: input.title,
        spaceId: input.spaceId,
        status: 'todo',
        assigneeId: input.assigneeId ?? null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      },
    });
  }

  async update(id: string, patch: { title?: string; assigneeId?: string | null; dueAt?: string | null; status?: TaskStatus }) {
    // Ensure existence
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');

    return this.prisma.task.update({
      where: { id },
      data: {
        title: patch.title ?? undefined,
        assigneeId: patch.assigneeId === undefined ? undefined : patch.assigneeId,
        dueAt: patch.dueAt === undefined ? undefined : patch.dueAt ? new Date(patch.dueAt) : null,
        status: patch.status ?? undefined,
      },
    });
  }
}
