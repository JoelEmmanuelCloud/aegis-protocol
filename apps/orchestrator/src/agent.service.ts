import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { AgentRegistration } from '@aegis/types';

@Injectable()
export class AgentService {
  private readonly agents = new Map<string, AgentRegistration>();

  register(registration: AgentRegistration): AgentRegistration {
    if (this.agents.has(registration.ensName)) {
      throw new ConflictException(`Agent ${registration.ensName} already registered`);
    }
    this.agents.set(registration.ensName, registration);
    return registration;
  }

  findByEnsName(ensName: string): AgentRegistration {
    const agent = this.agents.get(ensName);
    if (!agent) throw new NotFoundException(`Agent ${ensName} not found`);
    return agent;
  }

  findAll(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }

  updateINFT(ensName: string, iNFTAddress: string): AgentRegistration {
    const agent = this.findByEnsName(ensName);
    agent.iNFTAddress = iNFTAddress;
    this.agents.set(ensName, agent);
    return agent;
  }
}
