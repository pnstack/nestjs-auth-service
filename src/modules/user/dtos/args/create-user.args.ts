import { CreateUserInput } from '../inputs/create-user.input';
import { CreateBaseArgs } from '@/modules/common/dtos/args/CreateBaseArgs';
import { ArgsType } from '@nestjs/graphql';

@ArgsType()
class CreateUserArgs extends CreateBaseArgs(CreateUserInput) {}

export { CreateUserArgs };
