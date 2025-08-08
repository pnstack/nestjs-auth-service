import { GqlConfigService } from './gql-config.service';
import { PubSubModule } from './pubsub.module';
import { PubSubService } from './pubsub.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Global, Module } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';

@Global()
@Module({
  imports: [
    NestGraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GqlConfigService,
    }),
    PubSubModule,
  ],
  providers: [PubSubService],
  exports: [PubSubService],
})
export class GraphQLModule {}
