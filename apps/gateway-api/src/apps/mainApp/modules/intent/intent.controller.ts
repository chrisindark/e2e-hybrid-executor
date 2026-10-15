import { Body, Controller, Post } from '@nestjs/common';
import { IsString } from 'class-validator';

import { IntentService } from './intent.service';

class GenerateTestDto {
  @IsString()
  intent!: string;

  @IsString()
  targetUrl!: string;
}

@Controller('intent')
export class IntentController {
  constructor(private readonly intentService: IntentService) {}

  @Post()
  async generate(@Body() dto: GenerateTestDto) {
    const test = await this.intentService.generateTest(
      dto.intent,
      dto.targetUrl,
    );

    return test;
  }
}
