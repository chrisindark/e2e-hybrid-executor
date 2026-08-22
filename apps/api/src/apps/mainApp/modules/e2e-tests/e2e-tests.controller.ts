import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';

import { CreateE2eTestDto } from './dto/create-e2e-test.dto';
import { UpdateE2eTestDto } from './dto/update-e2e-test.dto';
import { E2eTestsService } from './e2e-tests.service';

@Controller('e2e-tests')
export class E2eTestsController {
  constructor(private readonly e2eTestsService: E2eTestsService) {}

  /** Create and persist a test in the TestDefinition / test.json shape. */
  @Post()
  create(@Body() dto: CreateE2eTestDto) {
    return this.e2eTestsService.create(dto);
  }

  @Get()
  list() {
    return this.e2eTestsService.list();
  }

  @Get(':testId')
  get(@Param('testId') testId: string) {
    return this.e2eTestsService.get(testId);
  }

  @Put(':testId')
  update(@Param('testId') testId: string, @Body() dto: UpdateE2eTestDto) {
    return this.e2eTestsService.update(testId, dto);
  }

  // @Delete(':testId')
  // remove(@Param('testId') testId: string) {
  //   return this.e2eTestsService.remove(testId);
  // }
}
