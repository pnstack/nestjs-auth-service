import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class KongService implements OnModuleInit {
  private readonly logger = new Logger(KongService.name);
  private readonly adminUrl: string;
  private readonly serviceName: string;
  private readonly serviceHost: string;
  private readonly servicePort: number;
  private readonly servicePath: string;

  constructor(private configService: ConfigService) {
    this.adminUrl = this.configService.get<string>('KONG_ADMIN_URL');
    this.serviceName = this.configService.get<string>('KONG_SERVICE_NAME');
    this.serviceHost = this.configService.get<string>('KONG_SERVICE_HOST');
    this.servicePort = Number(this.configService.get<number>('KONG_SERVICE_PORT'));
    this.servicePath = this.configService.get<string>('KONG_SERVICE_PATH');

    console.log('conffig', {
      adminUrl: this.adminUrl,
      serviceName: this.serviceName,
      serviceHost: this.serviceHost,
      servicePort: this.servicePort,
      servicePath: this.servicePath,
    });
  }

  async onModuleInit() {
    await this.registerService();
  }

  private async registerService() {
    try {
      // Check if service exists
      const serviceExists = await this.checkServiceExists();

      if (serviceExists) {
        await this.updateService();
        this.logger.log(`Updated Kong service: ${this.serviceName}`);
      } else {
        await this.createService();
        this.logger.log(`Created Kong service: ${this.serviceName}`);
      }

      // Configure routes
      const res = await this.configureRoutes();
      this.logger.log('Kong routes configured successfully', res);
    } catch (error) {
      this.logger.error(
        'Failed to register service with Kong',
        error?.response?.data || error?.message
      );
    }
  }

  private async checkServiceExists(): Promise<boolean> {
    try {
      await axios.get(`${this.adminUrl}/services/${this.serviceName}`);
      return true;
    } catch (error) {
      if (error?.response?.status === 404) {
        return false;
      }
      throw error;
    }
  }

  private async createService() {
    await axios.post(`${this.adminUrl}/services`, {
      name: this.serviceName,
      host: this.serviceHost,
      port: this.servicePort,
      path: '/',
      protocol: 'http',
    });
  }

  private async updateService() {
    await axios.patch(`${this.adminUrl}/services/${this.serviceName}`, {
      host: this.serviceHost,
      port: this.servicePort,
      path: '/',
      protocol: 'http',
    });
  }

  private async configureRoutes() {
    // Check if route exists
    const routes = await this.getServiceRoutes();
    const routeName = `${this.serviceName}-route`;

    if (routes.length === 0) {
      // Create new route
      return await axios
        .post(`${this.adminUrl}/services/${this.serviceName}/routes`, {
          name: routeName,
          paths: [this.servicePath],
          strip_path: false,
          preserve_host: true,
          protocols: ['http', 'https'],
        })
        .then((res) => res.data);
    } else {
      // Update existing route
      return await axios
        .patch(`${this.adminUrl}/routes/${routeName}`, {
          paths: [this.servicePath],
          strip_path: false,
          preserve_host: true,
          protocols: ['http', 'https'],
        })
        .then((res) => res.data);
    }
  }

  private async getServiceRoutes() {
    const response = await axios.get(`${this.adminUrl}/services/${this.serviceName}/routes`);
    return response.data.data || [];
  }
}
