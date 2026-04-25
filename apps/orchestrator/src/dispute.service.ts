import { Injectable } from '@nestjs/common';
import type { DisputeRecord } from '@aegis/types';

const VERIFIER_AXL_URL = `http://localhost:${process.env.AXL_VERIFIER_PORT ?? 9012}/send`;
const VERIFIER_PEER_ID = process.env.AXL_VERIFIER_PEER_ID ?? '';

@Injectable()
export class DisputeService {
  async fileDispute(
    rootHash: string,
    agentId: string,
    disputedBy: string,
    reason: string
  ): Promise<DisputeRecord> {
    const record: DisputeRecord = {
      rootHash,
      agentId,
      disputedBy,
      reason,
      timestamp: Date.now(),
    };

    await fetch(VERIFIER_AXL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Destination-Peer-Id': VERIFIER_PEER_ID,
      },
      body: JSON.stringify({ type: 'VERIFY_DECISION', rootHash, agentId }),
    });

    return record;
  }
}
