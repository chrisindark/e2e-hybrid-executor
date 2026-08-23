import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { CreateE2eTestDto } from './dto/create-e2e-test.dto';
import { UpdateE2eTestDto } from './dto/update-e2e-test.dto';
import { GenerationService } from './e2e-tests.service';

@Controller('generation')
export class GenerationController {
  constructor(private readonly generationService: GenerationService) {}

  /** Create and persist a test in the TestDefinition / test.json shape. */
  @Post()
  create(@Body() dto: CreateE2eTestDto) {
    return this.generationService.create(dto);
  }

  @Get()
  list() {
    return this.generationService.list();
  }

  @Get(':testId')
  get(@Param('testId') testId: string) {
    return this.generationService.get(testId);
  }

  @Put(':testId')
  update(@Param('testId') testId: string, @Body() dto: UpdateE2eTestDto) {
    return this.generationService.update(testId, dto);
  }

  // @Delete(':testId')
  // remove(@Param('testId') testId: string) {
  //   return this.generationService.remove(testId);
  // }
}
