import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { SpacesModule } from './spaces/spaces.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [SpacesModule, TasksModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
