import { Module } from '@nestjs/common';
import { DigestsController } from './digests.controller';
import { DigestsService } from './digests.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [DigestsController],
  providers: [DigestsService, PrismaService],
})
export class DigestsModule {}
