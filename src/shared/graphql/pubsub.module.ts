import { PubSubService } from './pubsub.service';
import { Global, Module } from '@nestjs/common';

@Module({
  providers: [PubSubService],
  exports: [PubSubService],
})
export class PubSubModule {}
