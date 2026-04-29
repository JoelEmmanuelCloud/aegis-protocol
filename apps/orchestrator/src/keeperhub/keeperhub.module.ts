import { Module } from '@nestjs/common';
import { KeeperHubController } from './keeperhub.controller';
import { KeeperHubService } from './keeperhub.service';

@Module({
  controllers: [KeeperHubController],
  providers: [KeeperHubService],
})
export class KeeperHubModule {}
