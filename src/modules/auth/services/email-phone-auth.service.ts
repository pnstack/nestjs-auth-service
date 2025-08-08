import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma';
import { PasswordService } from './password.service';
import { OtpService } from './otp-auth.service';
import { SessionService } from './session.service';

export interface EmailPhoneLoginDto {
  identifier: string; // email or phone
  password?: string;
  useOtp?: boolean;
}

export interface EmailPhoneRegisterDto {
  email?: string;
  phone?: string;
  password: string;
  fullName: string;
  verifyMethod?: 'email' | 'phone';
}

@Injectable()
export class EmailPhoneAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly otpService: OtpService,
    private readonly sessionService: SessionService
  ) {}

  async loginWithEmailOrPhone(loginDto: EmailPhoneLoginDto) {
    const { identifier, password, useOtp } = loginDto;
    
    // Determine if identifier is email or phone
    const isEmail = this.isEmail(identifier);
    const whereClause = isEmail ? { email: identifier } : { phone: identifier };

    const user = await this.prisma.user.findUnique({
      where: whereClause,
      include: {
        UserRole: {
          include: {
            Role: true
          }
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (useOtp) {
      // For OTP login, we don't verify password
      return await this.initiateOtpLogin(identifier);
    }

    if (!password) {
      throw new BadRequestException('Password is required for non-OTP login');
    }

    if (!user.password) {
      throw new BadRequestException('User has no password set. Please use OTP login or reset password.');
    }

    const isPasswordValid = await this.passwordService.validatePassword(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    // Verify that the login method is verified
    if (isEmail && !user.isEmailVerified) {
      throw new BadRequestException('Email not verified. Please verify your email first.');
    }
    
    if (!isEmail && !user.isPhoneVerified) {
      throw new BadRequestException('Phone not verified. Please verify your phone first.');
    }

    return await this.sessionService.createSession(user.id, 'EMAIL_PHONE_LOGIN');
  }

  async registerWithEmailOrPhone(registerDto: EmailPhoneRegisterDto) {
    const { email, phone, password, fullName, verifyMethod = 'email' } = registerDto;

    if (!email && !phone) {
      throw new BadRequestException('Either email or phone must be provided');
    }

    // Check if user already exists
    const existingUser = await this.findExistingUser(email, phone);
    if (existingUser) {
      throw new BadRequestException('User with this email or phone already exists');
    }

    const hashedPassword = await this.passwordService.hashPassword(password);

    const user = await this.prisma.user.create({
      data: {
        email,
        phone,
        password: hashedPassword,
        fullName,
        UserRole: {
          create: {
            roleName: 'user'
          }
        }
      }
    });

    // Send verification based on chosen method
    if (verifyMethod === 'email' && email) {
      await this.otpService.generateEmailVerificationOtp(email, user.id);
    } else if (verifyMethod === 'phone' && phone) {
      await this.otpService.generatePhoneVerificationOtp(phone, user.id);
    }

    return {
      message: `Registration successful. Please verify your ${verifyMethod}.`,
      userId: user.id,
      verificationRequired: true
    };
  }

  async verifyEmailOrPhone(identifier: string, otp: string) {
    const isEmail = this.isEmail(identifier);
    const otpType = isEmail ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION';

    const isValid = await this.otpService.verifyOtp(identifier, otp, otpType as any);
    
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update user verification status
    const whereClause = isEmail ? { email: identifier } : { phone: identifier };
    const updateData = isEmail ? { isEmailVerified: true } : { isPhoneVerified: true };

    const user = await this.prisma.user.update({
      where: whereClause,
      data: updateData
    });

    return {
      message: `${isEmail ? 'Email' : 'Phone'} verified successfully`,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified
      }
    };
  }

  async resendVerification(identifier: string) {
    const isEmail = this.isEmail(identifier);
    const whereClause = isEmail ? { email: identifier } : { phone: identifier };

    const user = await this.prisma.user.findUnique({
      where: whereClause
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (isEmail) {
      await this.otpService.generateEmailVerificationOtp(identifier, user.id);
    } else {
      await this.otpService.generatePhoneVerificationOtp(identifier, user.id);
    }

    return {
      message: `Verification ${isEmail ? 'email' : 'SMS'} sent successfully`
    };
  }

  private async initiateOtpLogin(identifier: string) {
    const isEmail = this.isEmail(identifier);
    const whereClause = isEmail ? { email: identifier } : { phone: identifier };

    const user = await this.prisma.user.findUnique({
      where: whereClause
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate OTP for login
    await this.otpService.generateOtp(identifier, user.id, 'LOGIN' as any);

    return {
      message: `OTP sent to your ${isEmail ? 'email' : 'phone'}`,
      requiresOtp: true
    };
  }

  private async findExistingUser(email?: string, phone?: string) {
    if (email && phone) {
      return await this.prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { phone }
          ]
        }
      });
    } else if (email) {
      return await this.prisma.user.findUnique({
        where: { email }
      });
    } else if (phone) {
      return await this.prisma.user.findUnique({
        where: { phone }
      });
    }
    return null;
  }

  private isEmail(identifier: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(identifier);
  }

  async findUserByIdentifier(identifier: string) {
    const isEmail = this.isEmail(identifier);
    const whereClause = isEmail ? { email: identifier } : { phone: identifier };
    
    return this.prisma.user.findUnique({
      where: whereClause
    });
  }
}