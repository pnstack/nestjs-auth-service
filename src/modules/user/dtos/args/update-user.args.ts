import { WhereUniqueUserInput } from '../inputs/UserWhereInput';
import { CreateUserInput } from '../inputs/create-user.input';
import { UpdateUserInput } from '../inputs/update-user.input';
import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class UpdateUserArgs {
  @Field()
  data: UpdateUserInput;
  @Field()
  where: WhereUniqueUserInput;
}
