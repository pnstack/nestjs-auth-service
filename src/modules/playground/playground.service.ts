import { RedisdbService } from '@/shared/database/redisdb/redisdb.service';
import { OpendalService } from '@/shared/storage/opendal/opendal.service';
import { cache } from '@/utils';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PlaygroundService {
  constructor(private readonly opendalService: OpendalService) {}

  @cache(60)
  async getCachedData() {
    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: 'Cached data retrieved successfully',
          data: {
            symbol: 'AAPL',
            price: 150,
          },
        });
      }, 2000);
    });
  }
}
