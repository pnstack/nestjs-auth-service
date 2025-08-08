import { Injectable } from '@nestjs/common';
import { Operator } from 'opendal';

@Injectable()
export class OpendalService {
  constructor() {}

  async test() {
    const op = new Operator('fs', { root: './tmp' });
    await op.write('test', 'Hello, World!');
    const bs = await op.read('test');
    console.log(new TextDecoder().decode(bs));
    const meta = await op.stat('test');
    console.log(`contentLength: ${meta.contentLength}`);
  }

  async redis() {
    const op = new Operator('redis-service', {
      endpoint: 'redis://localhost:6479',
    });

    // Write a key-value pair to Redis
    await op.write('test_key', 'Hello, Redis!');
    console.log('Write operation successful');
  }
}
