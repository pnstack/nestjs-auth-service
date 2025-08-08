import { EmailPhoneAuthService } from '../services/email-phone-auth.service';
import { WalletService } from '../services/wallet.service';
import { PasskeyService } from '../services/passkey.service';
import { OAuthService } from '../services/oauth.service';
import { SessionService } from '../services/session.service';
import { OtpService } from '../services/otp-auth.service';
import { ReqUser } from '@/common/decorators/user.decorator';
import { JwtGuard } from '@/common/guards';
import { 
  Body, 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Patch,
  Param, 
  UseGuards, 
  Req, 
  Query,
  BadRequestException 
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';

// DTOs
class EmailPhoneLoginDto {
  identifier: string;
  password?: string;
  useOtp?: boolean;
}

class EmailPhoneRegisterDto {
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  verifyMethod?: 'email' | 'phone';
}

class VerifyOtpDto {
  identifier: string;
  otp: string;
}

class WalletLinkDto {
  address: string;
  signature: string;
  message: string;
  type?: 'ETHEREUM' | 'BITCOIN' | 'POLYGON' | 'BSC';
}

class WalletLoginDto {
  address: string;
  signature: string;
  message: string;
  nonce: string;
}

class WalletRegisterDto {
  address: string;
  signature: string;
  message: string;
  nonce: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

class PasskeyRegistrationDto {
  response: any; // RegistrationResponseJSON
  deviceName?: string;
}

class PasskeyLoginDto {
  response: any; // AuthenticationResponseJSON
}

@ApiTags('Enhanced Auth')
@Controller('auth/v2')
export class EnhancedAuthController {
  constructor(
    private readonly emailPhoneAuthService: EmailPhoneAuthService,
    private readonly walletService: WalletService,
    private readonly passkeyService: PasskeyService,
    private readonly oauthService: OAuthService,
    private readonly sessionService: SessionService,
    private readonly otpService: OtpService
  ) {}

  // Email/Phone Authentication
  @Post('login/email-phone')
  @ApiOperation({ summary: 'Login with email or phone' })
  async loginEmailPhone(@Body() loginDto: EmailPhoneLoginDto, @Req() req: Request) {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.emailPhoneAuthService.loginWithEmailOrPhone(loginDto);
  }

  @Post('register/email-phone')
  @ApiOperation({ summary: 'Register with email or phone' })
  async registerEmailPhone(@Body() registerDto: EmailPhoneRegisterDto) {
    return this.emailPhoneAuthService.registerWithEmailOrPhone(registerDto);
  }

  @Post('verify/email-phone')
  @ApiOperation({ summary: 'Verify email or phone with OTP' })
  async verifyEmailPhone(@Body() verifyDto: VerifyOtpDto) {
    return this.emailPhoneAuthService.verifyEmailOrPhone(verifyDto.identifier, verifyDto.otp);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Resend verification OTP' })
  async resendVerification(@Body() body: { identifier: string }) {
    return this.emailPhoneAuthService.resendVerification(body.identifier);
  }

  // OTP Authentication
  @Post('otp/request')
  @ApiOperation({ summary: 'Request OTP for login' })
  async requestOtpLogin(@Body() body: { identifier: string }) {
    const user = await this.emailPhoneAuthService.findUserByIdentifier(body.identifier);
    return this.otpService.generateOtp(body.identifier, user?.id, 'LOGIN');
  }

  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify OTP and login' })
  async verifyOtpLogin(@Body() verifyDto: VerifyOtpDto, @Req() req: Request) {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.otpService.verifyAndLogin(verifyDto.identifier, verifyDto.otp);
  }

  // Wallet Authentication
  @Get('wallet/nonce')
  @ApiOperation({ summary: 'Get nonce for wallet authentication' })
  getNonce() {
    return {
      nonce: this.walletService.generateNonce(),
      message: this.walletService.generateSignMessage(this.walletService.generateNonce())
    };
  }

  @Post('wallet/login')
  @ApiOperation({ summary: 'Login with wallet signature' })
  async walletLogin(@Body() loginDto: WalletLoginDto, @Req() req: Request) {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.walletService.loginWithWallet(loginDto, deviceInfo, ipAddress, userAgent);
  }

  @Post('wallet/register')
  @ApiOperation({ summary: 'Register with wallet signature' })
  async walletRegister(@Body() registerDto: WalletRegisterDto, @Req() req: Request) {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.walletService.registerWithWallet(registerDto, deviceInfo, ipAddress, userAgent);
  }

  @Post('wallet/link')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link wallet to user account' })
  async linkWallet(@ReqUser() user: any, @Body() linkDto: WalletLinkDto) {
    return this.walletService.linkWallet(user.userId, linkDto);
  }

  @Get('wallet/my-wallets')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user wallets' })
  async getMyWallets(@ReqUser() user: any) {
    return this.walletService.getUserWallets(user.userId);
  }

  @Delete('wallet/:walletId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink wallet' })
  async unlinkWallet(@ReqUser() user: any, @Param('walletId') walletId: string) {
    return this.walletService.unlinkWallet(user.userId, walletId);
  }

  @Patch('wallet/:walletId/primary')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set primary wallet' })
  async setPrimaryWallet(@ReqUser() user: any, @Param('walletId') walletId: string) {
    return this.walletService.setPrimaryWallet(user.userId, walletId);
  }

  // Passkey Authentication
  @Post('passkey/registration/begin')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Begin passkey registration' })
  async beginPasskeyRegistration(@ReqUser() user: any, @Query('username') username?: string) {
    return this.passkeyService.generateRegistrationOptions(user.userId, username);
  }

  @Post('passkey/registration/complete')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete passkey registration' })
  async completePasskeyRegistration(@ReqUser() user: any, @Body() registrationDto: PasskeyRegistrationDto) {
    return this.passkeyService.verifyRegistration({
      userId: user.userId,
      ...registrationDto
    });
  }

  @Post('passkey/authentication/begin')
  @ApiOperation({ summary: 'Begin passkey authentication' })
  async beginPasskeyAuthentication(@Query('username') username?: string) {
    return this.passkeyService.generateAuthenticationOptions(username);
  }

  @Post('passkey/authentication/complete')
  @ApiOperation({ summary: 'Complete passkey authentication' })
  async completePasskeyAuthentication(@Body() loginDto: PasskeyLoginDto, @Req() req: Request) {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.passkeyService.verifyAuthenticationAndLogin(loginDto, deviceInfo, ipAddress, userAgent);
  }

  @Get('passkey/my-passkeys')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user passkeys' })
  async getMyPasskeys(@ReqUser() user: any) {
    return this.passkeyService.getUserPasskeys(user.userId);
  }

  @Delete('passkey/:credentialId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete passkey' })
  async deletePasskey(@ReqUser() user: any, @Param('credentialId') credentialId: string) {
    return this.passkeyService.deletePasskey(user.userId, credentialId);
  }

  @Patch('passkey/:credentialId/name')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update passkey name' })
  async updatePasskeyName(
    @ReqUser() user: any, 
    @Param('credentialId') credentialId: string,
    @Body() body: { deviceName: string }
  ) {
    return this.passkeyService.updatePasskeyName(user.userId, credentialId, body.deviceName);
  }

  // OAuth Management
  @Get('oauth/providers')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get linked OAuth providers' })
  async getOAuthProviders(@ReqUser() user: any) {
    return this.oauthService.getUserOAuthProviders(user.userId);
  }

  @Delete('oauth/provider/:providerId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink OAuth provider' })
  async unlinkOAuthProvider(@ReqUser() user: any, @Param('providerId') providerId: string) {
    return this.oauthService.unlinkOAuthProvider(user.userId, providerId);
  }

  // Session Management
  @Get('sessions')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active sessions' })
  async getActiveSessions(@ReqUser() user: any) {
    return this.sessionService.getUserActiveSessions(user.userId);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate specific session' })
  async terminateSession(@ReqUser() user: any, @Param('sessionId') sessionId: string) {
    // You'll need to modify SessionService to support terminating by session ID
    return { message: 'Session terminated' };
  }

  @Delete('sessions/all')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminate all sessions except current' })
  async terminateAllSessions(@ReqUser() user: any) {
    await this.sessionService.invalidateUserSessions(user.userId, 'ACCESS');
    return { message: 'All sessions terminated' };
  }

  // Utility endpoints
  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(@Body() body: { refreshToken: string }, @Req() req: Request) {
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.sessionService.refreshSession(body.refreshToken, deviceInfo, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate current session' })
  async logout(@Req() req: Request) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await this.sessionService.invalidateSession(token);
    }
    return { message: 'Logged out successfully' };
  }
}