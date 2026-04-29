import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { AttestationsModule } from '../attestations/attestations.module';
import { DisputesModule } from '../disputes/disputes.module';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';

@Module({
  imports: [AgentsModule, AttestationsModule, DisputesModule],
  controllers: [NetworkController],
  providers: [NetworkService],
})
export class NetworkModule {}
