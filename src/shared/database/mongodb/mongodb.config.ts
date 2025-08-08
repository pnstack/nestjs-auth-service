import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions, MongooseOptionsFactory } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import * as mongoose from 'mongoose';

dotenv.config();

@Injectable()
export class MongodbConfig implements MongooseOptionsFactory {
  constructor(private readonly configService: ConfigService) {}
  createMongooseOptions(): Promise<MongooseModuleOptions> | MongooseModuleOptions {
    const config = {
      host: this.configService.get('MONGODB_HOST'),
      port: this.configService.get('MONGODB_PORT'),
      user: this.configService.get('MONGODB_USER'),
      password: this.configService.get('MONGODB_PASSWORD'),
      database: this.configService.get('MONGODB_DB'),
      authsource: 'admin',
    };

    mongoose.set('debug', true);

    return {
      uri: `mongodb://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?authSource=${config.authsource}`,
      onConnectionCreate: (connection) => {
        console.log('connected to mongodb database');
      },
    };
  }
}
