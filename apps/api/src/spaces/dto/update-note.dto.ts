import { IsString, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @MaxLength(200)
  title!: string;
}
