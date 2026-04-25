import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AgentService } from './agent.service';
import type { AgentRegistration } from '@aegis/types';

@Controller('agents')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  register(@Body() body: Omit<AgentRegistration, 'registeredAt'>): AgentRegistration {
    return this.agentService.register({ ...body, registeredAt: Date.now() });
  }

  @Get()
  findAll(): AgentRegistration[] {
    return this.agentService.findAll();
  }

  @Get(':ensName')
  findOne(@Param('ensName') ensName: string): AgentRegistration {
    return this.agentService.findByEnsName(ensName);
  }
}
