import { Injectable, OnModuleInit } from '@nestjs/common';
import { Novu } from '@novu/api';
import { use } from 'passport';

@Injectable()
export class NovuService implements OnModuleInit {
  novu: Novu;

  // constructor() {}

  onModuleInit() {
    this.novu = new Novu({
      secretKey: process.env.NOVU_API_KEY,
      serverURL: process.env.NOVU_API_URL,
    });

    this.novu.trigger({
      to: {
        subscriberId: '682ca4cb27095fedc9eb8c5e',
        email: 'npv2k1@gmail.com',
      },
      workflowId: 'system',
      payload: {},
    });
  }

  async sendOtpEmail(user, otp: string) {
    const notification = await this.novu.trigger({
      workflowId: 'otp',
      to: {
        email: user.email,
        subscriberId: user.id,
      },
      payload: {
        otp,
      },
    });
    return notification;
  }

  async createSubscriber(user: any) {
    const subscriber = await this.novu.subscribers.create({
      // email,
      // firstName: 'John',
      // lastName: 'Doe',
      // subscriberId: '',
      email: user?.email,
      subscriberId: user?.id,
    });

    return subscriber;
  }

  async updateSubscriber(user: any) {
    try {
      const subscriber = await this.novu.subscribers.update(user?.id, user);
      return subscriber;
    } catch (error) {
      // Fallback to create if update fails
      console.log('Update failed, creating subscriber:', error.message);
      const subscriber = await this.createSubscriber(user);
      return subscriber;
    }
  }
}
