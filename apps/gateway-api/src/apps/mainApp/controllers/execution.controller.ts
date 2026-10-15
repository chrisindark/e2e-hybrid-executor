import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

import { ExecutionService } from '../../../modules/execution/execution.service';
import { ExecutionMode } from '../../../shared/trace-event.entity';

class RunTestDto {
  @IsOptional()
  @IsEnum(ExecutionMode)
  mode?: ExecutionMode;

  @IsOptional()
  @IsNumber()
  forceFailureAtStep?: number;
}

@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Get()
  list() {
    return this.executionService.list();
  }

  @Get(':runId')
  get(@Param('runId') runId: string) {
    return this.executionService.getRun(runId);
  }

  @Post(':testId/run')
  @HttpCode(HttpStatus.ACCEPTED)
  run(@Param('testId') testId: string, @Body() dto: RunTestDto) {
    return this.executionService.runTest(testId, {
      mode: dto.mode,
      forceFailureAtStep: dto.forceFailureAtStep,
    });
  }

  @Get(':testId/rerun')
  reRun(@Param('testId') testId: string, @Query('order') order: number) {
    return this.executionService.reRunTest(testId, order);
  }

  // @Post('open-ai/completion')
  // getOpenAICompletion(@Body() dto: OpenAIDto) {
  //   return this.executionService.getOpenAICompletion(dto.content);
  // }

  // @Post('gemini/completion')
  // getGeminiCompletion(@Body() dto: OpenAIDto) {
  //   return this.executionService.getGeminiCompletion(dto.content);
  // }
}
