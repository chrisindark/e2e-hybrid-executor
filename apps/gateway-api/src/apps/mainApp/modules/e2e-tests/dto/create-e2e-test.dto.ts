import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { TestAction } from '../../../../../shared/types';

/** One step in an e2e test — matches the shape in execution/test.json. */
export class CreateE2eTestStepDto {
  /** Optional; generated if omitted. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stepId?: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  order!: number;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(TestAction)
  action!: TestAction;

  @ValidateIf(
    (s: CreateE2eTestStepDto) =>
      s.action === TestAction.Click ||
      s.action === TestAction.Fill ||
      s.action === TestAction.AssertText ||
      s.action === TestAction.AssertVisible,
  )
  @IsString()
  selector!: string;

  @ValidateIf(
    (s: CreateE2eTestStepDto) =>
      s.action === TestAction.Goto || s.action === TestAction.Fill,
  )
  @IsString()
  @ValidateIf((s: CreateE2eTestStepDto) => s.action === TestAction.Goto)
  @IsNotEmpty()
  value?: string;

  @IsString()
  @IsNotEmpty()
  expectedOutcome!: string;
}

export class CreateE2eTestDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  originalIntent!: string;

  @IsUrl({ require_tld: false })
  targetUrl!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateE2eTestStepDto)
  steps!: CreateE2eTestStepDto[];
}
