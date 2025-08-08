import { OpendalService } from './opendal.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  exports: [OpendalService],
  providers: [OpendalService],
})
export class OpendalModule {}
