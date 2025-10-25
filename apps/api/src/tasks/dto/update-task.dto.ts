import { IsISO8601, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { TaskStatus } from './create-task.dto';

export class UpdateTaskDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  assigneeId?: string | null;

  @IsISO8601()
  @IsOptional()
  dueAt?: string | null;

  @IsIn(['todo', 'in_progress', 'done'])
  @IsOptional()
  status?: TaskStatus;
}