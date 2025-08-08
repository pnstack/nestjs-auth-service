import { ResponsePayload } from '../interfaces/response.interface';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponsePayload<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponsePayload<T>> {
    const request = context.switchToHttp().getRequest();
    const statusCode = context.switchToHttp().getResponse().statusCode;

    const isGraphQL = context.getType<string>() === 'graphql';

    // skip transformation for GraphQL
    if (isGraphQL) {
      const gqlContext = GqlExecutionContext.create(context);
      const info = gqlContext.getInfo();

      return next.handle().pipe(
        map((data) => {
          // For GraphQL, we should only transform the data if needed
          // Most of the time, you might want to leave the GraphQL response structure intact
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            return {
              ...data,
              __metadata: {
                timestamp: new Date().toISOString(),
                message: 'Success',
              },
            };
          }
          return data;
        })
      );
    }

    return next.handle().pipe(
      map((data) => {
        if (data && data.hasOwnProperty('validation')) {
          //  return details of validation errors
          return {
            statusCode: statusCode,
            message: 'Validation failed',
            data: data.validation,
            path: request.url,
            timestamp: new Date().toISOString(),
          };
        }
        return {
          statusCode,
          message: 'Success',
          data,
          path: request.url,
          timestamp: new Date().toISOString(),
        };
      })
    );
  }
}
