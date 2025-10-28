import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { SpacesModule } from './spaces/spaces.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { DigestsModule } from './digests/digests.module';

@Module({
  imports: [SpacesModule, TasksModule, AuthModule, DigestsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
