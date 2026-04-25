import { Injectable } from '@nestjs/common';
import { readKVObject } from '@aegis/0g-client';
import type { NetworkStats } from '@aegis/types';

@Injectable()
export class NetworkService {
  async getStats(): Promise<NetworkStats> {
    const stats = await readKVObject<NetworkStats>('aegis:network:stats');
    return stats ?? { totalAttestations: 0, disputes: 0, activeAgents: 0 };
  }
}
