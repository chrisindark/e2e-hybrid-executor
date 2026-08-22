import { Controller } from '@nestjs/common';

import { AgenticExecutionService } from './agentic-execution.service';

@Controller('agentic-execution')
export class AgentiExecutionController {
  constructor(
    private readonly agenticExecutionService: AgenticExecutionService,
  ) {}
}
