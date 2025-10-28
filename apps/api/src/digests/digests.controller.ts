import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DigestsService } from './digests.service';

type PostDigestsBody = { spaceId: string };

@Controller('digests')
export class DigestsController {
  constructor(private readonly digests: DigestsService) {}

  @Post()
  async create(@Body() body: PostDigestsBody) {
    if (!body?.spaceId) return { ok: false, error: 'spaceId is required' };
    const data = await this.digests.composeAndSummarize(body.spaceId);
    return { ok: true, data };
  }

  @Get('latest')
  async latest(@Query('spaceId') spaceId?: string) {
    if (!spaceId) return { ok: false, error: 'spaceId is required' };
    const data = await this.digests.getLatest(spaceId);
    return { ok: true, data };
  }
}
