import { Module } from '@nestjs/common';
import { AgentsModule } from './agents/agents.module';
import { AttestationsModule } from './attestations/attestations.module';
import { DisputesModule } from './disputes/disputes.module';
import { NetworkModule } from './network/network.module';
import { KeeperHubModule } from './keeperhub/keeperhub.module';

@Module({
  imports: [AgentsModule, AttestationsModule, DisputesModule, NetworkModule, KeeperHubModule],
})
export class AppModule {}
