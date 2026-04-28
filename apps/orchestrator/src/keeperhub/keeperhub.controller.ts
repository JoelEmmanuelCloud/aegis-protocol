import { Controller, Get, Query } from '@nestjs/common';
import { KeeperHubService } from './keeperhub.service';

@Controller('keeperhub')
export class KeeperHubController {
  constructor(private readonly keeperHubService: KeeperHubService) {}

  @Get('audit')
  audit(@Query('workflowId') workflowId: string, @Query('limit') limit?: string) {
    return this.keeperHubService.audit(workflowId, limit ? parseInt(limit, 10) : 20);
  }
}
