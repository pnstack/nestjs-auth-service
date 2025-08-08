import { RoleResolver } from './role.resolver';
import { RoleService } from './role.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [RoleResolver, RoleService],
})
export class RoleModule {}
