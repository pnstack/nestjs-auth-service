import { NatsService } from './nat.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [NatsService],
  exports: [NatsService],
})
export class NatsModule {}
