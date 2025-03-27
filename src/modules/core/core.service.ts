import { ResponsePayload } from './interfaces/response.interface';
import { Injectable, HttpStatus } from '@nestjs/common';

@Injectable()
export class ResponseBuilder {
  static success<T>(data: T, message = 'Success'): ResponsePayload<T> {
    return {
      statusCode: HttpStatus.OK,
      message,
      data,
    };
  }

  static created<T>(data: T, message = 'Created successfully'): ResponsePayload<T> {
    return {
      statusCode: HttpStatus.CREATED,
      message,
      data,
    };
  }

  static error<T>(statusCode: number, message: string, data?: T): ResponsePayload<T> {
    return {
      statusCode,
      message,
      data,
    };
  }

  static badRequest<T>(message = 'Bad request', data?: T): ResponsePayload<T> {
    return this.error(HttpStatus.BAD_REQUEST, message, data);
  }

  static notFound<T>(message = 'Not found', data?: T): ResponsePayload<T> {
    return this.error(HttpStatus.NOT_FOUND, message, data);
  }

  static unauthorized<T>(message = 'Unauthorized', data?: T): ResponsePayload<T> {
    return this.error(HttpStatus.UNAUTHORIZED, message, data);
  }

  static forbidden<T>(message = 'Forbidden', data?: T): ResponsePayload<T> {
    return this.error(HttpStatus.FORBIDDEN, message, data);
  }
}