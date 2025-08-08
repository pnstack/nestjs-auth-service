import { NovuModule } from './modules/novu/novu.module';
import { PlaygroundModule } from './modules/playground/playground.module';
import { PortfolioModule } from './modules/portfolio/portfolio.module';
import { RoleModule } from './modules/role/role.module';
import { SseModule } from './modules/sse/sse.module';
import { CoreModule } from './shared/core/core.module';
import { SignozModule } from './shared/core/signoz/signoz.module';
import { RabbitMqModule } from './shared/core/transporter/rabbitmq/rabbitmq.module';
import { MongodbModule } from './shared/database/mongodb/mongodb.module';
import { RedisdbModule } from './shared/database/redisdb/redisdb.module';
import { ScylladbModule } from './shared/database/scylladb/scylladb.module';
import { GraphQLModule } from './shared/graphql';
import { PrismaModule } from './shared/prisma';
import config from '@/common/configs/config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/user/users.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    RabbitMqModule,
    CoreModule,
    ScheduleModule.forRoot(),
    PrismaModule,
    GraphQLModule,
    AuthModule,
    UsersModule,
    RoleModule,
    PlaygroundModule,
    SseModule,
    MongodbModule,
    RedisdbModule,
    ScylladbModule,
    NovuModule,
    SignozModule,
    PortfolioModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
