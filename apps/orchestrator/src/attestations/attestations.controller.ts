import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AttestationsService } from './attestations.service';
import type { AttestationRequest } from '@aegis/types';

@Controller('attestations')
export class AttestationsController {
  constructor(private readonly attestationsService: AttestationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  submit(@Body() dto: AttestationRequest) {
    return this.attestationsService.submit(dto);
  }
}
