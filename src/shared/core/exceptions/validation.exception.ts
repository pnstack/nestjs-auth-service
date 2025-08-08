import { ResponsePayload } from '../interfaces/response.interface';
import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  constructor(errors: any) {
    const response: ResponsePayload<any> = {
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'Validation failed',
      data: errors,
      path: undefined,
      timestamp: new Date().toISOString(),
    };
    super(response, HttpStatus.BAD_REQUEST);
  }
}
