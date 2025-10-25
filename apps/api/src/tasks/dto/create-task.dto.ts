import { IsISO8601, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  spaceId!: string;

  @IsString()
  @IsOptional()
  assigneeId?: string;

  @IsISO8601()
  @IsOptional()
  dueAt?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';