import { KongService } from './kong.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [KongService],
  exports: [KongService],
})
export class KongModule {}
