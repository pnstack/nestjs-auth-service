import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/request/login-request.dto';
import { OtpAuthRequestDto } from './dto/request/otp-auth.dto';
import { OtpVerifyRequestDto } from './dto/request/otp-verify.dto';
import { SignupRequestDto } from './dto/request/signup-request.dto';
import { Token } from './entities/Token';
import { OtpAuthService } from './services/otp-auth.service';
import { Permissions } from '@/common/decorators/permissions.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ReqUser } from '@/common/decorators/user.decorator';
import { GoogleOauthGuard, JwtGuard } from '@/common/guards';
import { MicroServiceGuard } from '@/common/guards/micro-service.guard';
import { RolesPermissionsGuard } from '@/common/guards/roles-permisions.guard';
import { User } from '@/shared/prisma';
import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpAuthService: OtpAuthService
  ) {}

  @ApiResponse({
    type: [Token],
  })
  @Post('login')
  async login(@Body() loginInput: LoginRequestDto) {
    return await this.authService.login(loginInput);
  }

  @Post('register')
  async signup(@Body() data: SignupRequestDto) {
    const { accessToken, refreshToken } = await this.authService.createUser({
      ...data,
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  @ApiResponse({
    type: [Token],
  })
  @Post('refresh-token')
  async refreshToken(@Body() data: any) {
    return this.authService.refreshToken(data.token);
  }

  @ApiBearerAuth()
  @UseGuards(RolesPermissionsGuard)
  @Roles('user', 'admin')
  @Permissions('read:users')
  @Get('profile')
  async profile(@ReqUser() user: User) {
    return user;
  }

  @ApiBearerAuth()
  @UseGuards(MicroServiceGuard)
  @Roles('user', 'admin')
  @Permissions('read:users')
  @Get('profile-microservice')
  async profileMicroservce(@ReqUser() user: User) {
    return user;
  }

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  async auth() {
    // function is empty because it's a guard
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    console.log(req.user);
    const { email } = req.user;
    const token = await this.authService.googleAuth(req.user);
    // TODO: add to env
    return res.redirect(`${process.env.FRONTEND_URL}/auth/login?accessToken=${token.accessToken}`);
  }

  @Post('request-otp')
  async requestOtp(@Body() body: OtpAuthRequestDto) {
    return await this.otpAuthService.generateOtp(body.username);
  }

  @Post('login-otp')
  async loginOtp(@Body() body: OtpVerifyRequestDto) {
    return await this.otpAuthService.verifyOtp(body.username, body.otp);
  }
}
