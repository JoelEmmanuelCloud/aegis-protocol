import { Injectable, BadGatewayException } from '@nestjs/common';
import type { AttestationRequest, AttestationResponse, AttestationListResponse } from '@aegis/types';

@Injectable()
export class AttestationsService {
  private readonly witnessUrl: string;

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

    return response.json() as Promise<AttestationResponse>;
  }

  async list(agentId?: string, cursor?: string, limit = 20): Promise<AttestationListResponse> {
    const params = new URLSearchParams();
    if (agentId) params.set('agentId', agentId);
    if (cursor) params.set('cursor', cursor);
    params.set('limit', String(limit));

    const response = await fetch(`${this.witnessUrl}/attestations?${params}`).catch(() => null);
    if (!response || !response.ok) return { items: [], nextCursor: null };

    return response.json() as Promise<AttestationListResponse>;
  }
}
