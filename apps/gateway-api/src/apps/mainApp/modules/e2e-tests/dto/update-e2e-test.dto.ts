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
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

import { TestAction } from '../../../../../shared/types';
import { CreateE2eTestStepDto } from './create-e2e-test.dto';

export class UpdateTestDefinitionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  originalIntent?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  targetUrl?: string;
}

/** Partial update for one existing step. The stepId identifies the step. */
export class UpdateE2eTestStepDto {
  @IsUUID()
  stepId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsEnum(TestAction)
  action?: TestAction;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  selector?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  expectedOutcome?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

/** Update one or both parts of an e2e test. */
export class UpdateE2eTestDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateTestDefinitionDto)
  testDefinition?: UpdateTestDefinitionDto;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateE2eTestStepDto)
  steps?: CreateE2eTestStepDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateE2eTestStepDto)
  step?: UpdateE2eTestStepDto;
}
