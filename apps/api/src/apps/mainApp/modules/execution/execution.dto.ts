import {
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class OpenAIDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsObject()
  schema?: any;
}

export class RunOptions {
  /** Step `order` to deliberately break, simulating UI drift. Optional -
   *  omit to run the whole test deterministically with no forced failure. */
  @IsOptional()
  @IsNumber()
  forceFailureAtStep?: number;
}
