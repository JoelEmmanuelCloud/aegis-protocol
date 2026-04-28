import { Injectable, BadGatewayException } from '@nestjs/common';
import type { AttestationRequest, AttestationResponse, AttestationListResponse, AttestationItem } from '@aegis/types';

@Injectable()
export class AttestationsService {
  private readonly witnessUrl: string;
  private readonly log: AttestationItem[] = [];

  constructor() {
    const axlPort = parseInt(process.env.AXL_WITNESS_PORT ?? '9002', 10);
    this.witnessUrl = process.env.WITNESS_MGMT_URL || `http://localhost:${axlPort + 1000}`;
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

    const result = await response.json() as AttestationResponse;
    this.log.unshift({
      agentId: dto.agentId,
      rootHash: result.rootHash,
      verdict: 'PENDING',
      timestamp: dto.timestamp,
    });
    if (this.log.length > 500) this.log.pop();
    return result;
  }

  async list(agentId?: string, cursor?: string, limit = 20): Promise<AttestationListResponse> {
    const params = new URLSearchParams();
    if (agentId) params.set('agentId', agentId);
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));

    const witnessItems = await fetch(`${this.witnessUrl}/attestations?${params}`)
      .then((r) => (r.ok ? (r.json() as Promise<AttestationListResponse>) : null))
      .catch(() => null);

    const remote: AttestationItem[] = witnessItems?.items ?? [];
    const remoteHashes = new Set(remote.map((i) => i.rootHash));
    const localOnly = this.log.filter((i) => {
      if (agentId && i.agentId !== agentId) return false;
      return !remoteHashes.has(i.rootHash);
    });

    const merged = [...localOnly, ...remote].sort((a, b) => b.timestamp - a.timestamp);

    const pageSize = limit;
    const startIdx = cursor ? merged.findIndex((i) => i.rootHash === cursor) + 1 : 0;
    const page = merged.slice(startIdx, startIdx + pageSize);
    const hasMore = startIdx + pageSize < merged.length;

    return { items: page, nextCursor: hasMore ? (page[page.length - 1]?.rootHash ?? null) : null };
  }
}
