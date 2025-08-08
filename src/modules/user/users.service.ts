import { NatsService } from '../../shared/core/transporter/nats/nat.service';
import { RabbitMqService } from '../../shared/core/transporter/rabbitmq/rabbitmq.service';
import { RedisService } from '../../shared/core/transporter/redis/redis.service';
import { PasswordService } from '@/modules/auth/services/password.service';
import { KafkaService } from '@/shared/core/transporter/kafka/kafka.service';
import { Prisma, PrismaService } from '@/shared/prisma';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    protected prisma: PrismaService,
    protected passwordService: PasswordService,

    private readonly rabbitMqService: RabbitMqService,
    private readonly redisService: RedisService,
    private readonly natsService: NatsService
  ) {}

  onModuleInit() {
    // this.rabbitMqService.consume(
    //   'user-service',
    //   async (msg) => {
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    //     const data = JSON.parse(msg.content.toString());
    //     console.log('Received message:', data);
    //   },
    //   {
    //     noAck: false,
    //   }
    // );

    // this.rabbitMqService.consume(
    //   'user-service',
    //   async (msg) => {
    //     await new Promise((resolve) => setTimeout(resolve, 1000));
    //     const data = JSON.parse(msg.content.toString());
    //     console.log('Received message 2:', data);
    //   },
    //   {
    //     noAck: false,
    //   }
    // );

    this.natsService.subscribe('user-service', async (message) => {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      console.log('Received message nats:', message);
    });

    // this.redisService.subscribe('user-service', (message) => {
    //   console.log('Received message:', message);
    // });

    // this.redisService.subscribe('user-service2', (message) => {
    //   console.log('Received message: 2', message);
    // });

    // this.kafkaService.subscribe(
    //   'user-service',
    //   async (message) => {
    //     // await new Promise((resolve) => setTimeout(resolve, 5000));
    //     console.log('Received message kafka:', message);
    //   },
    //   {
    //     groupId: 'user-service1',
    //   }
    // );

    // this.kafkaService.subscribe(
    //   'user-service',
    //   async (message) => {
    //     // await new Promise((resolve) => setTimeout(resolve, 5000));
    //     console.log('Received message kafka 2:', message);
    //   },
    //   {
    //     groupId: 'user-service2',
    //   }
    // );
  }

  @Interval(100)
  async ping() {
    // this.redisService.publish('user-service', { id: new Date() });
    // this.natsService.publish('user-service', { id: new Date() });
    // this.kafkaService.publish('user-service', {
    //   id: new Date(),
    //   name: 'test',
    // });
  }

  async getUserRole(id: string) {
    return this.prisma.user
      .findUnique({
        where: {
          id: id,
        },
      })
      .UserRole();
  }

  async createUser(args: Prisma.UserCreateArgs, roles?: string[]) {
    const hashedPassword = await this.passwordService.hashPassword(args.data.password);
    args.data.password = hashedPassword;
    const user = await this.prisma.user.create({
      data: {
        ...args.data,
      },
    });
    await this.updateOrCreateRoles(user.id, roles);
    return this.prisma.user.findUnique({ where: { id: user.id } });
  }

  async updateUser(args: Prisma.UserUpdateArgs, roles?: string[]) {
    if (args.data.password) {
      const hashedPassword = await this.passwordService.hashPassword(args.data.password as string);
      args.data.password = hashedPassword;
    } else {
      delete args.data.password;
    }
    if (roles) {
      await this.updateOrCreateRoles(args.where.id, roles);
    }
    return this.prisma.user.update({
      data: {
        ...args.data,
      },
      where: args.where,
    });
  }

  async updateOrCreateRoles(userId: string, roles: string[]) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        UserRole: true,
      },
    });

    const newRoles = roles.filter((role) => {
      return !user.UserRole.find((userRole) => userRole.roleName === role);
    });

    // create new roles
    await this.prisma.userRole.createMany({
      data: newRoles.map((role) => ({
        roleName: role,
        userId: userId,
      })),
    });

    if (!user.UserRole) {
      const deleteRoles = user.UserRole.filter((userRole) => {
        return !roles.find((role) => role === userRole.roleName);
      });

      await this.prisma.userRole.deleteMany({
        where: {
          id: {
            in: deleteRoles.map((role) => role.id),
          },
        },
      });
    }
  }

  async deleteUser(args: Prisma.UserDeleteArgs) {
    return this.prisma.user.delete(args);
  }

  async aggregate<T extends Prisma.UserAggregateArgs>(
    args: Prisma.SelectSubset<T, Prisma.UserAggregateArgs>
  ): Promise<Prisma.GetUserAggregateType<T>> {
    return this.prisma.user.aggregate(args);
  }

  async findUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: id,
      },
      include: {
        UserRole: true,
      },
    });

    delete user.password;
    return user;
  }
}
