import { NovuController } from './novu.controller';
import { NovuService } from './novu.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [NovuController],
  providers: [NovuService],
  exports: [NovuService],
})
export class NovuModule {}
