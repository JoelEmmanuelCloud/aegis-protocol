import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AttestationService } from './attestation.service';
import type { AttestationRequest, AttestationResponse, ReputationRecord } from '@aegis/types';

@Controller('attestations')
export class AttestationController {
  constructor(private readonly attestationService: AttestationService) {}

  @Post()
  attest(@Body() request: AttestationRequest): Promise<AttestationResponse> {
    return this.attestationService.attest(request);
  }

  @Get('reputation/:agentId')
  getReputation(@Param('agentId') agentId: string): Promise<ReputationRecord | null> {
    return this.attestationService.getReputation(agentId);
  }

  @Get('stats')
  getNetworkStats() {
    return this.attestationService.getNetworkStats();
  }
}
