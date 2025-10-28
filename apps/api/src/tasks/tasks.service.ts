import { Injectable, NotFoundException } from '@nestjs/common';
import type { TaskStatus } from './dto/create-task.dto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  listBySpace(spaceId: string) {
    return this.prisma.task.findMany({ where: { spaceId } });
  }

  async create(input: { title: string; spaceId: string; assigneeId?: string; dueAt?: string }) {
    const data: Prisma.TaskUncheckedCreateInput = {
      title: input.title,
      spaceId: input.spaceId,
      status: 'todo',
      assigneeId: input.assigneeId ?? null,
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
    } as any;
    (data as any).description = (input as any).description ?? null;
    const task = await this.prisma.task.create({ data });
    // Log event
    try {
      if ((this.prisma as any).eventLog?.create) {
        await (this.prisma as any).eventLog.create({
          data: {
            spaceId: task.spaceId,
            type: 'task.created',
            payload: { id: task.id, title: task.title },
          },
        });
      }
    } catch (_) {
      // ignore logging failures in MVP
    }
    return task;
  }

  async update(id: string, patch: { title?: string; description?: string | null; assigneeId?: string | null; dueAt?: string | null; status?: TaskStatus }) {
    // Ensure existence
    const existing = await this.prisma.task.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Task not found');

    const patchData: Prisma.TaskUncheckedUpdateInput = {
      title: patch.title ?? undefined,
      assigneeId: patch.assigneeId === undefined ? undefined : patch.assigneeId,
      dueAt: patch.dueAt === undefined ? undefined : patch.dueAt ? new Date(patch.dueAt) : null,
      status: patch.status ?? undefined,
    } as any;
    (patchData as any).description = patch.description === undefined ? undefined : patch.description;
    const updated = await this.prisma.task.update({
      where: { id },
      data: patchData,
    });
    // Log event
    try {
      if ((this.prisma as any).eventLog?.create) {
        await (this.prisma as any).eventLog.create({
          data: {
            spaceId: updated.spaceId,
            type: 'task.updated',
            payload: { id: updated.id, changes: patch },
          },
        });
      }
    } catch (_) {
      // ignore logging failures in MVP
    }
    return updated;
  }
}
