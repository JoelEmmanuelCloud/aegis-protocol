import { Injectable } from '@nestjs/common';
import { writeKVObject, readKVObject, uploadObject } from '@aegis/0g-client';
import type {
  AttestationRequest,
  AttestationResponse,
  DecisionRecord,
  ReputationRecord,
  NetworkStats,
} from '@aegis/types';

const WITNESS_AXL_URL = `http://localhost:${process.env.AXL_WITNESS_PORT ?? 9002}/send`;
const WITNESS_PEER_ID = process.env.AXL_WITNESS_PEER_ID ?? '';

@Injectable()
export class AttestationService {
  async attest(request: AttestationRequest): Promise<AttestationResponse> {
    const response = await fetch(WITNESS_AXL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Destination-Peer-Id': WITNESS_PEER_ID,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Witness node error: ${response.statusText}`);
    }

    return response.json() as Promise<AttestationResponse>;
  }

  async getReputation(agentId: string): Promise<ReputationRecord | null> {
    return readKVObject<ReputationRecord>(`aegis:${agentId}:reputation`);
  }

  async getNetworkStats(): Promise<NetworkStats> {
    const stats = await readKVObject<NetworkStats>('aegis:network:stats');
    return stats ?? { totalAttestations: 0, disputes: 0, activeAgents: 0 };
  }

  async storeDecision(record: DecisionRecord): Promise<string> {
    const rootHash = await uploadObject(record);
    await writeKVObject(`aegis:${record.agentId}:latest`, {
      rootHash,
      timestamp: record.timestamp,
      verdict: record.verdict,
    });
    return rootHash;
  }
}
