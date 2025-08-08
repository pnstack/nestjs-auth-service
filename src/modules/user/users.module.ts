import { NatsService } from '../../shared/core/transporter/nats/nat.service';
import { NatsModule } from '../../shared/core/transporter/nats/nats.module';
import { RabbitMqModule } from '../../shared/core/transporter/rabbitmq/rabbitmq.module';
import { RedisModule } from '../../shared/core/transporter/redis/redis.module';
import { UsersController } from './users.controller';
import { UserResolver } from './users.resolver';
import { UsersService } from './users.service';
import { PasswordService } from '@/modules/auth/services/password.service';
import { KafkaModule } from '@/shared/core/transporter/kafka/kafka.module';
import { Module } from '@nestjs/common';
import { Kafka } from 'kafkajs';

@Module({
  imports: [RabbitMqModule, RedisModule, NatsModule, KafkaModule],
  providers: [UsersService, PasswordService, UserResolver],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
