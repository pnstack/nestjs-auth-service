import { NovuModule } from '../novu/novu.module';
import { NovuService } from '../novu/novu.service';
import { UsersModule } from '../user/users.module';
import { AuthController } from './auth.controller';
import { EnhancedAuthController } from './enhanced-auth.controller';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { OtpAuthService, OtpService } from './services/otp-auth.service';
import { PasswordService } from './services/password.service';
import { EmailPhoneAuthService } from './services/email-phone-auth.service';
import { SessionService } from './services/session.service';
import { WalletService } from './services/wallet.service';
import { PasskeyService } from './services/passkey.service';
import { OAuthService } from './services/oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SecurityConfig } from '@/common/configs/config.interface';
import { GqlAuthGuard } from '@/common/guards';
import { WsGuard } from '@/common/guards/ws/ws.guard';
import { RedisdbModule } from '@/shared/database/redisdb/redisdb.module';
import { PubSubModule } from '@/shared/graphql/pubsub.module';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Global()
@Module({
  imports: [
    RedisdbModule,
    PubSubModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => {
        const securityConfig = configService.get<SecurityConfig>('security');
        return {
          secret: configService.get<string>('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: securityConfig.expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    NovuModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    PasswordService,
    WsGuard,
    GoogleStrategy,
    AuthResolver,
    GqlAuthGuard,
    OtpAuthService,
    OtpService,
    EmailPhoneAuthService,
    SessionService,
    WalletService,
    PasskeyService,
    OAuthService,
  ],
  exports: [
    AuthService, 
    WsGuard, 
    SessionService, 
    EmailPhoneAuthService, 
    WalletService, 
    PasskeyService, 
    OAuthService,
    OtpService
  ],
  controllers: [AuthController, EnhancedAuthController],
})
export class AuthModule {}
