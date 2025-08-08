import { RedisdbController } from './redisdb.controller';
import { RedisdbService } from './redisdb.service';
import { Module } from '@nestjs/common';

@Module({
  controllers: [RedisdbController],
  providers: [RedisdbService],
  exports: [RedisdbService],
})
export class RedisdbModule {}
