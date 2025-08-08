import { Role } from './entities/role.entity';
import { RoleService } from './role.service';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver(() => Role)
export class RoleResolver {
  constructor(private readonly roleService: RoleService) {}

  @Query(() => [Role], {
    name: 'Role',
  })
  async findMany() {
    return this.roleService.findMany();
  }
}
