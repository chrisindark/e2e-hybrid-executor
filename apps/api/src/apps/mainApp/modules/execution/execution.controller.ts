import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { IsNumber, IsOptional } from 'class-validator';

import { OpenAIDto } from './execution.dto';
import { ExecutionService } from './execution.service';

class RunTestDto {
  @IsOptional()
  @IsNumber()
  forceFailureAtStep?: number;
}

@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Get('run/:runId')
  getRun(@Param('runId') runId: string) {
    return this.executionService.getRun(runId);
  }

  @Post(':testId/run')
  run(@Param('testId') testId: string, @Body() dto: RunTestDto) {
    return this.executionService.runTest(testId, {
      forceFailureAtStep: dto.forceFailureAtStep,
    });
  }

  @Get(':testId/rerun')
  reRun(@Param('testId') testId: string, @Query('order') order: number) {
    return this.executionService.reRunTest(testId, order);
  }

  @Post('open-ai/completion')
  getCompletion(@Body() dto: OpenAIDto) {
    return this.executionService.getCompletion(dto.content);
  }
}
