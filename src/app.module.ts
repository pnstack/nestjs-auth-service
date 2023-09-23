import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import config from '@/common/configs/config';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/user/users.module';

import { RoleModule } from './modules/role/role.module';
import { GraphQLModule } from './shared/graphql';
import { PrismaModule } from './shared/prisma';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [config] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    GraphQLModule,
    AuthModule,
    UsersModule,
    RoleModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
