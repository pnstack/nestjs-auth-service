import { Controller, Get, Inject, Injectable, Ip, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Core')
@Controller('')
export class CoreControler {
  @Get('ping')
  ping() {
    return 'pong';
  }

  @Get('health')
  async healthCheck() {
    return 'ok';
  }

  @Get('info')
  async info(@Req() request) {
    return {
      // 1. Network Information
      network: {
        ip: request.ip,
        forwardedFor: request.headers['x-forwarded-for'],
        realIp: request.headers['x-real-ip'],
        host: request.headers.host,
        origin: request.headers.origin,
        referer: request.headers.referer,
      },

      // 2. Browser & Device
      browser: {
        userAgent: request.headers['user-agent'],
        acceptLanguage: request.headers['accept-language'],
        acceptEncoding: request.headers['accept-encoding'],
        dnt: request.headers.dnt,
      },

      // 3. Request Context
      request: {
        method: request.method,
        url: request.url,
        protocol: request.protocol,
        secure: request.secure,
        params: request.params,
        query: request.query,
        body: request.body,
      },

      // 4. Authentication
      auth: {
        authorization: request.headers.authorization,
        cookies: request.headers.cookie,
        session: request.session,
        user: request.user, // if authenticated
      },

      // 5. Custom Headers (client có thể gửi)
      custom: {
        timezone: request.headers['x-timezone'],
        clientId: request.headers['x-client-id'],
        appVersion: request.headers['x-app-version'],
        platform: request.headers['x-platform'],
        deviceId: request.headers['x-device-id'],
      },

      // 6. Timestamps
      timestamps: {
        requestTime: new Date().toISOString(),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  }

  @Get('exception')
  testException() {
    throw new Error('Test exception');
  }
}
