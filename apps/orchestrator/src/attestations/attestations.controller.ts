import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AttestationsService } from './attestations.service';
import type { AttestationRequest } from '@aegis/types';

@Controller('attestations')
export class AttestationsController {
  constructor(private readonly attestationsService: AttestationsService) {}

  @Get()
  list(
    @Query('agentId') agentId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.attestationsService.list(agentId, cursor, limit ? parseInt(limit, 10) : undefined);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: AttestationRequest) {
    return this.attestationsService.submit(dto);
  }
}
