import { CreateUserDto } from './dto/create-user.dto';
import { Playground } from './playground.model';
import { PlaygroundService } from './playground.service';
import { StockPriceRepository } from '@/shared/database/mongodb/repositories/stock-price.repository';
import { RedisdbService } from '@/shared/database/redisdb/redisdb.service';
import { OpendalService } from '@/shared/storage/opendal/opendal.service';
import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { ApiBody, ApiOAuth2, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Model } from 'mongoose';

@ApiTags('Playground')
@Controller('playground')
export class PlaygroundController {
  constructor(
    private readonly playgroundService: PlaygroundService,
    private readonly opendalService: OpendalService,
    private readonly redisdbService: RedisdbService,
    @Inject('KAFKA_CLIENT') private readonly client: ClientKafka,

    @InjectModel(Playground.name) private model: typeof Model<Playground>,

    private readonly stockPriceRepository: StockPriceRepository
  ) {}

  @Get('test-storage')
  async testStorage() {
    this.opendalService.test();
  }

  @Get('redis')
  async testRedis() {
    this.opendalService.redis();
  }

  @MessagePattern('ping')
  async handlePing(body) {
    console.log('body', body);
    return 'pong';
  }

  @Get('ping-kafka')
  async testMicroservice() {
    this.client.emit('ping', {
      data: new Date(),
    });
    return 'ok';
  }

  @ApiBody({
    type: Object,
  })
  @Post('/mongodb')
  async saveData(@Body() body: any) {
    return await this.model.create(body);
  }

  @ApiBody({
    type: Object,
  })
  @Put('/mongodb/:id')
  async updateData(@Param('id') id: string, @Body() body: any) {
    return await this.model.updateOne({ _id: id }, body);
  }

  @Get('/mongodb/:id')
  async getData(@Param('id') id: string) {
    return await this.model.findById(id);
  }

  @Get('/mongodb')
  async getAllData() {
    return await this.model.find();
  }

  @Delete('/mongodb/delete/:id')
  async deleteData(@Param('id') id: string) {
    return await this.model.deleteOne({ _id: id });
  }

  @Post('/set-price')
  async setPrice() {
    return await this.stockPriceRepository.create({
      symbol: 'AAPL',
      price: 150,
    });
  }

  @Get('test-cache')
  async testCache() {
    return await this.playgroundService.getCachedData();
  }

  @ApiOperation({ summary: 'Get operation description' })
  @ApiResponse({ status: 200, description: 'Success response description' })
  @Get('user-name')
  async getUser(@Param() param: CreateUserDto) {
    return 'hello';
  }
}
