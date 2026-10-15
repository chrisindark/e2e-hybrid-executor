import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { RunService } from './run.service';

@Controller('runs')
export class RunController {
  constructor(private readonly runService: RunService) {}

  @Get()
  listRuns() {
    return this.runService.list();
  }

  @Get(':runId')
  async getRun(@Param('runId') runId: string) {
    const run = await this.runService.get(runId);

    if (!run) {
      throw new NotFoundException(`Run ${runId} not found`);
    }

    return run;
  }
}
