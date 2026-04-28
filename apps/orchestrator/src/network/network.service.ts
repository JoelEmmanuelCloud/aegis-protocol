import { Injectable } from '@nestjs/common';
import { readKVObject } from '@aegis/0g-client';
import { AgentsService } from '../agents/agents.service';
import type { NetworkStats } from '@aegis/types';

@Injectable()
export class NetworkService {
  constructor(private readonly agentsService: AgentsService) {}

  async getStats(): Promise<NetworkStats> {
    const stats = await readKVObject<NetworkStats>('aegis:network:stats').catch(() => null);
    return {
      totalAttestations: stats?.totalAttestations ?? 0,
      disputes: stats?.disputes ?? 0,
      activeAgents: this.agentsService.getActiveAgentCount(),
    };
  }
}
