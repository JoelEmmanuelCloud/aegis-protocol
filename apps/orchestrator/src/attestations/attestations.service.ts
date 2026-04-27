import { Injectable, BadGatewayException } from '@nestjs/common';
import { readKVObject } from '@aegis/0g-client';
import type { AttestationRequest, AttestationResponse } from '@aegis/types';

interface AgentHistoryEntry {
  rootHash: string;
  verdict: 'PENDING' | 'CLEARED' | 'FLAGGED';
  timestamp: number;
}

interface AgentHistory {
  agentId: string;
  entries: AgentHistoryEntry[];
  lastUpdated: number;
}

interface AttestationListResponse {
  items: AgentHistoryEntry[];
  nextCursor: string | null;
}

@Injectable()
export class AttestationsService {
  private readonly witnessUrl: string;

  constructor() {
    const axlPort = parseInt(process.env.AXL_WITNESS_PORT ?? '9002', 10);
    this.witnessUrl = process.env.WITNESS_MGMT_URL ?? `http://localhost:${axlPort + 1000}`;
  }

  async submit(dto: AttestationRequest): Promise<AttestationResponse> {
    const response = await fetch(`${this.witnessUrl}/attest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadGatewayException(`Witness node error: ${text}`);
    }

    return response.json() as Promise<AttestationResponse>;
  }

  async list(agentId?: string, cursor?: string, limit = 20): Promise<AttestationListResponse> {
    if (!agentId) {
      return { items: [], nextCursor: null };
    }

    const history = await readKVObject<AgentHistory>(`aegis:${agentId}:history`);
    const entries = history?.entries ?? [];

    const startIdx = cursor ? entries.findIndex((e) => e.rootHash === cursor) + 1 : 0;
    const page = entries.slice(startIdx, startIdx + limit);
    const hasMore = startIdx + limit < entries.length;
    const nextCursor = hasMore ? (page[page.length - 1]?.rootHash ?? null) : null;

    return { items: page, nextCursor };
  }
}
