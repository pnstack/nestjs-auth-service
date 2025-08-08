import { SetRedisDto } from './redisdb.dto';
import { RedisdbService } from './redisdb.service';
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('Redis')
@Controller('redis')
export class RedisdbController {
  constructor(private readonly redisService: RedisdbService) {}

  @Post('set')
  @ApiOperation({ summary: 'Set a key-value pair in Redis' })
  @ApiBody({ type: SetRedisDto })
  @ApiResponse({ status: 201, description: 'Key set successfully' })
  async set(@Body() body: SetRedisDto) {
    if (!body.key || body.value === undefined) {
      throw new HttpException('Key and value are required', HttpStatus.BAD_REQUEST);
    }
    await this.redisService.set(body.key, body.value, body.expireSeconds);
    return { message: 'OK' };
  }

  @Get('get/:key')
  @ApiOperation({ summary: 'Get the value for a key in Redis' })
  @ApiParam({ name: 'key', description: 'Key to retrieve' })
  @ApiResponse({ status: 200, description: 'Key found' })
  @ApiResponse({ status: 404, description: 'Key not found' })
  async get(@Param('key') key: string) {
    const value = await this.redisService.get(key);
    if (value === null) {
      throw new HttpException('Key not found', HttpStatus.NOT_FOUND);
    }
    return { key, value };
  }

  @Delete('del/:key')
  @ApiOperation({ summary: 'Delete a key from Redis' })
  @ApiParam({ name: 'key', description: 'Key to delete' })
  @ApiResponse({ status: 200, description: 'Key deleted' })
  async del(@Param('key') key: string) {
    const deleted = await this.redisService.del(key);
    return { key, deleted };
  }

  @Get('exists/:key')
  @ApiOperation({ summary: 'Check if a key exists in Redis' })
  @ApiParam({ name: 'key', description: 'Key to check' })
  @ApiResponse({ status: 200, description: 'Existence status returned' })
  async exists(@Param('key') key: string) {
    const exists = await this.redisService.exists(key);
    return { key, exists };
  }

  @Get('keys')
  @ApiOperation({ summary: 'Get all keys matching a pattern' })
  @ApiQuery({
    name: 'pattern',
    required: false,
    description: 'Pattern to match keys (default "*")',
  })
  @ApiResponse({ status: 200, description: 'Keys returned' })
  async keys(@Query('pattern') pattern: string = '*') {
    const keys = await this.redisService.keys(pattern);
    return { keys };
  }
}
