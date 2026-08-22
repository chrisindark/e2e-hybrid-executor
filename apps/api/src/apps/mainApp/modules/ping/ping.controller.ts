import { Controller, Get, Param, UseGuards } from '@nestjs/common';

// import { ApiBearerAuth } from '@nestjs/swagger';
import { BasicAuthGuard } from '../../../../guards/basic-auth.guard';
import { StaticJwtAuthGuard } from '../../../../guards/static-jwt-auth.guard';
import { PingService } from './ping.service';

@Controller('ping')
// @ApiBearerAuth('JwtAuth') // This is the one that needs to match the name in main.ts
export class PingController {
  constructor(private readonly pingService: PingService) {}

  @Get('/')
  ping() {
    return this.pingService.ping();
  }

  @Get('/:id')
  pingDetail(@Param('id') id: string) {
    return this.pingService.pingDetail(id);
  }

  @UseGuards(StaticJwtAuthGuard)
  @Get('/ping-jwt-authenticated')
  pingJwtAuthenticated() {
    return this.pingService.pingAuthenticated();
  }

  @UseGuards(BasicAuthGuard)
  @Get('/ping-basic-authenticated')
  pingBasicAuthenticated() {
    return this.pingService.pingAuthenticated();
  }

  @Get('/throw-http-error')
  pingThrowHttpError() {
    return this.pingService.pingThrowHttpError();
  }

  @Get('/throw-error')
  pingThrowError() {
    return this.pingService.pingThrowError();
  }

  @Get('/throw-unhandled-promise')
  pingThrowUnhandledPromise() {
    return this.pingService.pingThrowUnhandledPromise();
  }
}
