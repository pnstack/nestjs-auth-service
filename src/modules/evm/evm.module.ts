import { EvmController } from './evm.controller';
import { EvmService } from './evm.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [EvmController],
  providers: [EvmService],
})
export class EvmModule {}
