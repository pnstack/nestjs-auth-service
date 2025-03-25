import { CoreControler } from './core.controller';
import { ExceptionInterceptor } from './interceptors/exception.interceptor';
import { TransformInterceptor } from './interceptors/transftorm.interceptor';
import { ValidationPipe } from './pipes/validation.pipe';
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

@Global()
@Module({
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
  exports: [],
})
export class CoreModule {}
