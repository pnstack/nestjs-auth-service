import { Controller, Get, Inject, Injectable } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Core')
@Controller('')
export class CoreControler {
  @Get('ping')
  ping() {
    return 'pong';
  }

  @Get('exception')
  testException() {
    throw new Error('Test exception');
  }
}
