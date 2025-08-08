import { ROLE } from '@/common/constants';
import { PrismaService } from '@/shared/prisma';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class RoleService implements OnModuleInit {
  constructor(protected readonly prisma: PrismaService) {}

  async onModuleInit() {
    const res = await Promise.all(
      Object.keys(ROLE).map(async (key) => {
        return await this.prisma.role.upsert({
          where: { name: ROLE[key] },
          update: {},
          create: {
            name: ROLE[key],
            description: `${ROLE[key]} role`,
          },
        });
      })
    );

    console.log('Created roles', res);
  }

  async findMany() {
    return this.prisma.role.findMany();
  }
}
