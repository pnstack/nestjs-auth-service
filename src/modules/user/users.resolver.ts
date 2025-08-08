import { User } from './entities/User';
import { UserRole } from './entities/UserRole';
import { UsersService } from './users.service';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';

@Resolver(() => User)
export class UserResolver {
  constructor(protected readonly userService: UsersService) {}

  @ResolveField(() => [UserRole], { nullable: true })
  async userRole(@Parent() parent: User): Promise<UserRole[]> {
    const result = await this.userService.getUserRole(parent.id);
    console.log(result);

    if (!result) {
      return [];
    }
    return result;
  }

  @ResolveField(() => [String], { nullable: true, name: 'roles' })
  async getRoles(@Parent() parent: User) {
    const result = await this.userService.getUserRole(parent.id);
    return result.map((role) => role.roleName);
  }
}
