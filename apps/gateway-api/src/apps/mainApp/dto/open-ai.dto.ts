import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class OpenAIDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsObject()
  schema?: any;
}
