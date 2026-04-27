import { Module } from '@nestjs/common';
import { AgentsModule } from '../agents/agents.module';
import { NetworkController } from './network.controller';
import { NetworkService } from './network.service';

@Module({
  imports: [AgentsModule],
  controllers: [NetworkController],
  providers: [NetworkService],
})
export class NetworkModule {}
