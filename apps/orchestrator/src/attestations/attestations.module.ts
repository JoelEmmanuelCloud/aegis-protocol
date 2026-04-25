import { Module } from '@nestjs/common';
import { AttestationsController } from './attestations.controller';
import { AttestationsService } from './attestations.service';

@Module({
  controllers: [AttestationsController],
  providers: [AttestationsService],
})
export class AttestationsModule {}
