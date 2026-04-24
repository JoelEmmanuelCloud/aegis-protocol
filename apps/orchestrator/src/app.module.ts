import { Module } from '@nestjs/common';
import { AttestationController } from './attestation.controller';
import { AttestationService } from './attestation.service';
import { DisputeController } from './dispute.controller';
import { DisputeService } from './dispute.service';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  controllers: [AttestationController, DisputeController, AgentController],
  providers: [AttestationService, DisputeService, AgentService],
})
export class AppModule {}
