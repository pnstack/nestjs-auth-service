import { SseController } from './sse.controller';
import { SseService } from './sse.service';
import { RedisModule } from '@/shared/core/transporter/redis/redis.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [RedisModule],
  controllers: [SseController],
  providers: [SseService],
})
export class SseModule {}
