import { Injectable } from '@nestjs/common';
import { getAuditTrail } from '@aegis/keeper-client';
import type { WorkflowRun } from '@aegis/keeper-client';

@Injectable()
export class KeeperHubService {
  async audit(workflowId: string, limit = 20): Promise<WorkflowRun[]> {
    return getAuditTrail(workflowId, limit).catch(() => []);
  }
}
