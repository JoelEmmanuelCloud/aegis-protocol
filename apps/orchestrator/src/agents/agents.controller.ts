import { Controller, Post, Get, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AgentsService, RegisterAgentDto } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterAgentDto) {
    return this.agentsService.register(dto);
  }

  @Get('recent')
  getRecent(@Query('limit') limit?: string) {
    return this.agentsService.getRecent(limit ? parseInt(limit, 10) : 20);
  }

  @Get('label/:label')
  getByLabel(@Param('label') label: string) {
    return this.agentsService.getByLabel(label);
  }

  @Get('owner/:address')
  getByOwner(@Param('address') address: string) {
    return this.agentsService.getByOwner(address);
  }
}
