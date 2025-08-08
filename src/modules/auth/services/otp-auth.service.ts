import { AuthService } from '../auth.service';
import { NovuService } from '@/modules/novu/novu.service';
import { RedisdbService } from '@/shared/database/redisdb/redisdb.service';
import { HttpException, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import * as speakeasy from 'speakeasy';

type OtpType = 'LOGIN' | 'REGISTER' | 'PHONE_VERIFICATION' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR';

@Injectable()
export class OtpService {
  private otpTimeout = 300; // 5 minutes in seconds
  private otpLength = 6;

  constructor(
    private readonly novuService: NovuService,
    private readonly prismaService: PrismaService,
    private readonly authService: AuthService,
    private readonly redisdbService: RedisdbService
  ) {}

  async generateOtp(identifier: string, userId?: string, type: OtpType = 'LOGIN'): Promise<string> {
    // Clean up expired tokens first
    await this.cleanupExpiredTokens(identifier, type);

    // Check if there's an active token
    const existingToken = await this.prismaService.otpToken.findUnique({
      where: {
        identifier_type: {
          identifier,
          type
        }
      }
    });

    if (existingToken && !this.isTokenExpired(existingToken.expiresAt)) {
      throw new BadRequestException('OTP already sent. Please wait before requesting a new one.');
    }

    // Generate OTP
    const otp = this.generateRandomOtp();
    const expiresAt = new Date(Date.now() + this.otpTimeout * 1000);

    // Save OTP to database
    await this.prismaService.otpToken.upsert({
      where: {
        identifier_type: {
          identifier,
          type
        }
      },
      create: {
        identifier,
        token: otp,
        type,
        userId,
        expiresAt,
        attempts: 0,
        isUsed: false
      },
      update: {
        token: otp,
        expiresAt,
        attempts: 0,
        isUsed: false
      }
    });

    // Also store in Redis for quick access
    await this.redisdbService.set(`otp:${identifier}:${type}`, otp, this.otpTimeout);

    // Send OTP based on type
    await this.sendOtp(identifier, otp, type, userId);

    return otp;
  }

  async verifyOtp(identifier: string, otp: string, type: OtpType = 'LOGIN'): Promise<boolean> {
    const otpToken = await this.prismaService.otpToken.findUnique({
      where: {
        identifier_type: {
          identifier,
          type
        }
      }
    });

    if (!otpToken) {
      return false;
    }

    // Check if OTP is expired
    if (this.isTokenExpired(otpToken.expiresAt)) {
      await this.prismaService.otpToken.delete({
        where: { id: otpToken.id }
      });
      return false;
    }

    // Check if OTP is already used
    if (otpToken.isUsed) {
      return false;
    }

    // Check max attempts
    if (otpToken.attempts >= otpToken.maxAttempts) {
      await this.prismaService.otpToken.delete({
        where: { id: otpToken.id }
      });
      return false;
    }

    // Verify OTP
    if (otpToken.token !== otp) {
      // Increment attempts
      await this.prismaService.otpToken.update({
        where: { id: otpToken.id },
        data: { attempts: otpToken.attempts + 1 }
      });
      return false;
    }

    // Mark as used
    await this.prismaService.otpToken.update({
      where: { id: otpToken.id },
      data: { isUsed: true }
    });

    // Clean up Redis
    await this.redisdbService.del(`otp:${identifier}:${type}`);

    return true;
  }

  async generateEmailVerificationOtp(email: string, userId: string): Promise<string> {
    return this.generateOtp(email, userId, 'EMAIL_VERIFICATION');
  }

  async generatePhoneVerificationOtp(phone: string, userId: string): Promise<string> {
    return this.generateOtp(phone, userId, 'PHONE_VERIFICATION');
  }

  async generateTwoFactorOtp(identifier: string, userId: string): Promise<string> {
    return this.generateOtp(identifier, userId, 'TWO_FACTOR');
  }

  async generatePasswordResetOtp(identifier: string, userId: string): Promise<string> {
    return this.generateOtp(identifier, userId, 'PASSWORD_RESET');
  }

  async verifyAndLogin(identifier: string, otp: string): Promise<any> {
    const isValid = await this.verifyOtp(identifier, otp, 'LOGIN');
    
    if (!isValid) {
      throw new HttpException('Invalid or expired OTP', 400);
    }

    return await this.authService.login(
      {
        email: identifier,
        password: otp,
      },
      true // passwordLess login
    );
  }

  private generateRandomOtp(): string {
    return Math.floor(Math.random() * Math.pow(10, this.otpLength))
      .toString()
      .padStart(this.otpLength, '0');
  }

  private isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  private async cleanupExpiredTokens(identifier: string, type: OtpType): Promise<void> {
    await this.prismaService.otpToken.deleteMany({
      where: {
        identifier,
        type,
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }

  private async sendOtp(identifier: string, otp: string, type: OtpType, userId?: string): Promise<void> {
    const isEmail = this.isEmail(identifier);
    
    if (userId) {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId }
      });
      
      if (user && isEmail) {
        await this.novuService.sendOtpEmail(user, otp);
      } else if (user && !isEmail) {
        // TODO: Implement SMS sending
        console.log(`SMS OTP to ${identifier}: ${otp}`);
      }
    } else {
      if (isEmail) {
        // Send email to unregistered user
        console.log(`Email OTP to ${identifier}: ${otp}`);
      } else {
        // Send SMS to unregistered user
        console.log(`SMS OTP to ${identifier}: ${otp}`);
      }
    }
  }

  private isEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }
}

// Keep backward compatibility
export class OtpAuthService extends OtpService {
  async generateOtp(identifier: string) {
    const user = await this.prismaService.user.findUnique({
      where: { email: identifier },
    });
    if (!user) {
      throw new HttpException('User not found', 404);
    }
    
    return super.generateOtp(identifier, user.id, 'LOGIN');
  }

  async verifyOtp(identifier: string, otp: string) {
    return super.verifyAndLogin(identifier, otp);
  }
}