import { Injectable } from '@nestjs/common';
import { AgentsService } from '../agents/agents.service';
import { AttestationsService } from '../attestations/attestations.service';
import { DisputesService } from '../disputes/disputes.service';
import type { NetworkStats } from '@aegis/types';

@Injectable()
export class NetworkService {
  constructor(
    private readonly agentsService: AgentsService,
    private readonly attestationsService: AttestationsService,
    private readonly disputesService: DisputesService,
  ) {}

  getStats(): NetworkStats {
    return {
      totalAttestations: this.attestationsService.totalCount(),
      disputes: this.disputesService.disputeCount(),
      activeAgents: this.agentsService.getActiveAgentCount(),
    };
  }
}
