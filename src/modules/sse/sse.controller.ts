import { SseService } from './sse.service';
import { RedisService } from '@/shared/core/transporter/redis/redis.service';
import { PubSubService } from '@/shared/graphql/pubsub.service';
import { Controller, Sse } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('SSE')
@Controller('sse')
export class SseController {
  constructor(
    private readonly sseService: SseService,
    private readonly pubSubService: PubSubService,
    private readonly redisService: RedisService
  ) {}

  @Sse('events')
  @ApiResponse({
    status: 200,
    description: 'A stream of server-sent events with timestamped messages',
    type: 'text/event-stream',
  })
  sse(): any {
    // Create an Observable that combines Redis subscription with periodic events
    return new Observable<MessageEvent>((observer) => {
      // Subscribe to Redis channel
      const subscription = this.redisService.subscribe('sse', (message) => {
        console.log('sub', message);
        observer.next({
          data: JSON.stringify({
            message,
            timestamp: new Date().toISOString(),
          }),
        } as MessageEvent);
      });

      // Optional: Add periodic heartbeat to keep connection alive
      // const heartbeat = interval(2000).subscribe(() => {
      //   observer.next({
      //     data: ':heartbeat\n\n',
      //   } as MessageEvent);
      // });

      // Cleanup on unsubscribe
      return () => {
        this.redisService.unsubscribe('sse');
        // subscription.unsubscribe();
        // heartbeat.unsubscribe();
      };
    });
    //
    // return 'ok';
    return this.redisService.subscribe('sse', (message) => {
      console.log('message', message);
      return message;
    });
    return this.pubSubService.asyncIterator('sse');
  }
}
