import { OTLPLogger } from './logger.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [OTLPLogger],
  exports: [OTLPLogger],
})
export class SignozModule {}
