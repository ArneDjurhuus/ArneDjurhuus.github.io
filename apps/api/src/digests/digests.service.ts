import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DigestsService {
  constructor(private readonly prisma: PrismaService) {}

  async composeAndSummarize(spaceId: string) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const events = await this.prisma.eventLog.findMany({
      where: { spaceId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
      select: { type: true, payload: true },
    });

    const aiUrl = process.env.AI_URL || 'http://ai:8000';
    const res = await fetch(`${aiUrl}/digest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { id: 'digest_error', summary: `AI error: ${res.status} ${text}` };
    }

    const json = (await res.json()) as { id?: string; summary: string };

    // Persist digest and return
    const digest = await (this.prisma as any).digest.create({
      data: {
        spaceId,
        summary: json.summary,
      },
      select: { id: true, summary: true },
    });
    return { id: digest.id, summary: digest.summary };
  }

  async getLatest(spaceId: string) {
    const latest = await (this.prisma as any).digest.findFirst({
      where: { spaceId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, summary: true, createdAt: true },
    });
    return latest ?? null;
  }
}
