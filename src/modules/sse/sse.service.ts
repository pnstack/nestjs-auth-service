import { RedisService } from '@/shared/core/transporter/redis/redis.service';
import { PubSubService } from '@/shared/graphql/pubsub.service';
import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class SseService {
  constructor(
    private readonly pubSubService: PubSubService,
    private readonly redisService: RedisService
  ) {}

  @Interval(1000)
  async timmer() {
    // console.log('trigger');
    // this.pubSubService.publish('sse', {
    //   message: 'hello',
    // });

    this.redisService.publish('sse', {
      message: 'hello',
      date: new Date(),
    });
  }
}
