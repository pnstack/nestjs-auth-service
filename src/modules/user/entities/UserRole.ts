import { User } from './User';
import { Role } from '@/modules/role/entities/role.entity';
import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
class UserRole {
  @Field(() => Int)
  id: number;
  @Field(() => String)
  userId: string;
  @Field(() => String)
  roleName: string;

  Role?: Role;
  User?: User;
}

export { UserRole };
