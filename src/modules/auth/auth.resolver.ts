import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import {
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './dto/request/reset-password.input';
import { SignupRequestDto } from './dto/request/signup-request.dto';
import { Token } from './entities/Token';
import { UserEntity } from '@/common/decorators';
import { GqlAuthGuard } from '@/common/guards';
import { User } from '@/modules/user/entities/User';
import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

@Resolver(() => User)
export class AuthResolver {
  constructor(protected authService: AuthService) {}

  @Mutation(() => Token)
  async login(@Args('input') input: LoginRequestDto) {
    return this.authService.login(input);
  }

  @Mutation(() => Token)
  async signup(@Args('input') input: SignupRequestDto) {
    return this.authService.createUser(input);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => User)
  async me(@UserEntity() user: User) {
    return user;
  }

  @Mutation(() => String)
  async forgotPassword(@Args('input') { email }: ForgotPasswordInput) {
    await this.authService.forgotPassword(email.toLowerCase());
    return 'Success';
  }

  @Mutation(() => String)
  async resetPassword(@Args('input') { token, password }: ResetPasswordInput) {
    await this.authService.resetPassword({
      token,
      password,
    });
    return 'Success';
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => String)
  async changePassword(@Args('input') input: ChangePasswordInput, @UserEntity() user: User) {
    return this.authService.changePassword(input, user);
  }
}
