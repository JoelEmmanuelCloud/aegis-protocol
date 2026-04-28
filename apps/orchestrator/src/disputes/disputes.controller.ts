import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { DisputesService, FileDisputeDto } from './disputes.service';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  file(@Body() dto: FileDisputeDto) {
    return this.disputesService.file(dto);
  }

  @Get('all')
  listAll() {
    return this.disputesService.listAll();
  }

  @Get('count')
  count() {
    return this.disputesService.disputeCount();
  }

  @Get(':rootHash')
  get(@Param('rootHash') rootHash: string) {
    return this.disputesService.get(rootHash);
  }
}
