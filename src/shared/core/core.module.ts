import { CoreControler } from './core.controller';
import { ExceptionInterceptor } from './interceptors/exception.interceptor';
import { TransformInterceptor } from './interceptors/transftorm.interceptor';
import { KongModule } from './kong/kong.module';
import { ValidationPipe } from './pipes/validation.pipe';
import { KafkaModule } from './transporter/kafka/kafka.module';
import { RabbitMqModule } from './transporter/rabbitmq/rabbitmq.module';
// import { RabbitMqModule } from './transporter/rabbitmq/rabbitmq.module';
import { RabbitMqService } from './transporter/rabbitmq/rabbitmq.service';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

@Global()
@Module({
  imports: [KafkaModule, KongModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ExceptionInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe, // Using useClass instead of useValue
    },
  ],
  controllers: [CoreControler],
  exports: [KongModule],
})
export class CoreModule {}
