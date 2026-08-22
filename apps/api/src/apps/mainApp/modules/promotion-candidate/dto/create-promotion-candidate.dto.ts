import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

import { TestStep } from '../../../../../shared/test-step.entity';

export class CreatePromotionCandidateDto {
  @IsString()
  @IsNotEmpty()
  runId!: string;

  @IsString()
  @IsNotEmpty()
  testId!: string;

  @IsString()
  @IsNotEmpty()
  stepId!: string;

  @ValidateNested({ each: true })
  @Type(() => TestStep)
  originalStep!: TestStep;

  @ValidateNested({ each: true })
  @Type(() => TestStep)
  proposedStep!: TestStep;

  @IsString()
  reasoning!: string;
}
