import { bigIntMiddleware } from './middleware/bigint.middleware';
import { excludePasswordMiddleware } from './middleware/exclude-password.middleware';
import { loggingMiddleware } from './middleware/logging.middleware';
import { Global, Logger, Module } from '@nestjs/common';
import { PrismaModule as NestPrismaModule } from 'nestjs-prisma';

@Global()
@Module({
  imports: [
    NestPrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [
          loggingMiddleware(new Logger('PrismaMiddleware')),
          bigIntMiddleware(),
          excludePasswordMiddleware(),
        ],
        prismaOptions: {
          // log: ['info', 'query'],
        },
      },
    }),
  ],
  providers: [],
  exports: [],
})
export class PrismaModule {}
