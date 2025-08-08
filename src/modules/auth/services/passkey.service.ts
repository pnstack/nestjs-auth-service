import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma';
import { SessionService } from './session.service';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifyRegistrationResponseOpts,
  VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/types';

export interface PasskeyRegistrationDto {
  userId: string;
  response: RegistrationResponseJSON;
  deviceName?: string;
}

export interface PasskeyAuthenticationDto {
  response: AuthenticationResponseJSON;
}

export interface PasskeyLoginDto {
  response: AuthenticationResponseJSON;
}

@Injectable()
export class PasskeyService {
  private readonly rpName = 'NestJS Auth Service';
  private readonly rpId = process.env.PASSKEY_RP_ID || 'localhost';
  private readonly origin = process.env.PASSKEY_ORIGIN || 'http://localhost:4005';

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService
  ) {}

  /**
   * Generate registration options for a new passkey
   */
  async generateRegistrationOptions(userId: string, username?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        PasskeyCredentials: true
      }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Get existing credentials to exclude them
    const excludeCredentials = user.PasskeyCredentials.map(cred => ({
      id: Buffer.from(cred.credentialId, 'base64'),
      type: 'public-key' as const,
      transports: cred.transports ? JSON.parse(cred.transports as string) : undefined,
    }));

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpId,
      userID: Buffer.from(user.id),
      userName: username || user.email || user.phone || user.id,
      userDisplayName: user.fullName || username || 'User',
      attestationType: 'none',
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'discouraged',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    // Store challenge in database with expiration
    await this.prisma.otpToken.create({
      data: {
        userId: user.id,
        identifier: user.id,
        token: options.challenge,
        type: 'TWO_FACTOR', // Reusing OTP table for challenges
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      }
    });

    return options;
  }

  /**
   * Verify and register a new passkey credential
   */
  async verifyRegistration(registrationDto: PasskeyRegistrationDto) {
    const { userId, response, deviceName } = registrationDto;

    // Get the stored challenge
    const challengeRecord = await this.prisma.otpToken.findFirst({
      where: {
        userId,
        identifier: userId,
        type: 'TWO_FACTOR',
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!challengeRecord) {
      throw new BadRequestException('Invalid or expired challenge');
    }

    const expectedChallenge = challengeRecord.token;

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpId,
    });

    if (!verification.verified || !verification.registrationInfo) {
      // Mark challenge as used
      await this.prisma.otpToken.update({
        where: { id: challengeRecord.id },
        data: { isUsed: true }
      });
      throw new BadRequestException('Passkey registration failed');
    }

    const { credential } = verification.registrationInfo;
    const credentialID = credential.id;
    const credentialPublicKey = credential.publicKey;
    const counter = credential.counter;

    // Save the credential
    const credential = await this.prisma.passkeyCredential.create({
      data: {
        userId,
        credentialId: Buffer.from(credentialID).toString('base64'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64'),
        counter: BigInt(counter),
        deviceType: deviceName || 'Unknown Device',
        backed: false, // Can be updated based on authenticator info
        transports: JSON.stringify(response.response.transports || []),
      }
    });

    // Mark challenge as used
    await this.prisma.otpToken.update({
      where: { id: challengeRecord.id },
      data: { isUsed: true }
    });

    return {
      message: 'Passkey registered successfully',
      credentialId: credential.id,
      deviceType: credential.deviceType
    };
  }

  /**
   * Generate authentication options for passkey login
   */
  async generateAuthenticationOptions(username?: string) {
    let allowCredentials;

    if (username) {
      // Find user and their credentials
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: username },
            { phone: username },
            { id: username }
          ]
        },
        include: {
          PasskeyCredentials: true
        }
      });

      if (user) {
        allowCredentials = user.PasskeyCredentials.map(cred => ({
          id: Buffer.from(cred.credentialId, 'base64'),
          type: 'public-key' as const,
          transports: cred.transports ? JSON.parse(cred.transports as string) : undefined,
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpId,
      allowCredentials,
      userVerification: 'preferred',
    });

    // Store challenge for later verification
    await this.prisma.otpToken.create({
      data: {
        identifier: username || 'anonymous',
        token: options.challenge,
        type: 'TWO_FACTOR',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      }
    });

    return options;
  }

  /**
   * Verify passkey authentication and login user
   */
  async verifyAuthenticationAndLogin(
    loginDto: PasskeyLoginDto,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { response } = loginDto;

    // Find the credential
    const credential = await this.prisma.passkeyCredential.findUnique({
      where: {
        credentialId: Buffer.from(response.id, 'base64').toString('base64')
      },
      include: {
        User: true
      }
    });

    if (!credential) {
      throw new UnauthorizedException('Credential not found');
    }

    // Get the stored challenge
    const challengeRecord = await this.prisma.otpToken.findFirst({
      where: {
        type: 'TWO_FACTOR',
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!challengeRecord) {
      throw new BadRequestException('Invalid or expired challenge');
    }

    const expectedChallenge = challengeRecord.token;

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpId,
      credential: {
        id: Buffer.from(credential.credentialId, 'base64'),
        publicKey: Buffer.from(credential.publicKey, 'base64'),
        counter: Number(credential.counter),
      },
    });

    if (!verification.verified) {
      // Mark challenge as used
      await this.prisma.otpToken.update({
        where: { id: challengeRecord.id },
        data: { isUsed: true }
      });
      throw new UnauthorizedException('Passkey authentication failed');
    }

    // Update credential counter and last used
    await this.prisma.passkeyCredential.update({
      where: { id: credential.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date()
      }
    });

    // Mark challenge as used
    await this.prisma.otpToken.update({
      where: { id: challengeRecord.id },
      data: { isUsed: true }
    });

    // Create session
    return this.sessionService.createSession(
      credential.User.id,
      'PASSKEY',
      { deviceInfo, ipAddress, userAgent }
    );
  }

  /**
   * Get user's passkey credentials
   */
  async getUserPasskeys(userId: string) {
    return this.prisma.passkeyCredential.findMany({
      where: { userId },
      select: {
        id: true,
        deviceType: true,
        backed: true,
        createdAt: true,
        lastUsedAt: true
      },
      orderBy: {
        lastUsedAt: 'desc'
      }
    });
  }

  /**
   * Delete a passkey credential
   */
  async deletePasskey(userId: string, credentialId: string) {
    const credential = await this.prisma.passkeyCredential.findFirst({
      where: {
        id: credentialId,
        userId
      }
    });

    if (!credential) {
      throw new BadRequestException('Credential not found');
    }

    // Check if user has other authentication methods
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        PasskeyCredentials: true,
        WalletAccounts: true
      }
    });

    if (!user.password && !user.email && !user.phone && 
        user.PasskeyCredentials.length === 1 && 
        user.WalletAccounts.length === 0) {
      throw new BadRequestException('Cannot delete the only authentication method');
    }

    await this.prisma.passkeyCredential.delete({
      where: { id: credentialId }
    });

    return { message: 'Passkey deleted successfully' };
  }

  /**
   * Update passkey device name
   */
  async updatePasskeyName(userId: string, credentialId: string, deviceName: string) {
    const credential = await this.prisma.passkeyCredential.findFirst({
      where: {
        id: credentialId,
        userId
      }
    });

    if (!credential) {
      throw new BadRequestException('Credential not found');
    }

    await this.prisma.passkeyCredential.update({
      where: { id: credentialId },
      data: { deviceType: deviceName }
    });

    return { message: 'Passkey name updated successfully' };
  }
}