import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { SpacesModule } from './spaces/spaces.module';

@Module({
  imports: [SpacesModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
