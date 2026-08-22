import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsBoolean } from 'class-validator';

import { PromotionCandidateService } from './promotion-candidate.service';

class DecideDto {
  @IsBoolean()
  approve!: boolean;
}

@Controller('promotion-candidates')
export class PromotionCandidateController {
  constructor(private readonly promotionService: PromotionCandidateService) {}

  @Get(':promotionId')
  get(@Param('promotionId') promotionId: string) {
    return this.promotionService.get(promotionId);
  }

  @Get()
  list() {
    return this.promotionService.list();
  }

  @Post(':promotionId/decide')
  decide(@Param('promotionId') promotionId: string, @Body() dto: DecideDto) {
    return this.promotionService.decide(promotionId, dto.approve);
  }
}
