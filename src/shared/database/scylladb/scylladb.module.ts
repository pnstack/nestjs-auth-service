import { UserSessionRepository } from './repositories/user-session.repository';
import { ScylladbConfig } from './scylladb.config';
import { ScylladbService } from './scylladb.service';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ScylladbConfig,
    ScylladbService,
    UserSessionRepository,
    {
      provide: 'SCYLLA_CLIENT',
      useFactory: (scylladbService: ScylladbService) => {
        return scylladbService.getClient();
      },
      inject: [ScylladbService],
    },
  ],
  exports: [
    ScylladbService,
    UserSessionRepository,
    'SCYLLA_CLIENT',
  ],
})
export class ScylladbModule {}