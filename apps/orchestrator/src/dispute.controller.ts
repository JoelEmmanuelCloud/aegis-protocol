import { Controller, Post, Body } from '@nestjs/common';
import { DisputeService } from './dispute.service';
import type { DisputeRecord } from '@aegis/types';

interface DisputeRequestBody {
  rootHash: string;
  agentId: string;
  disputedBy: string;
  reason: string;
}

@Controller('disputes')
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post()
  fileDispute(@Body() body: DisputeRequestBody): Promise<DisputeRecord> {
    return this.disputeService.fileDispute(
      body.rootHash,
      body.agentId,
      body.disputedBy,
      body.reason
    );
  }
}
