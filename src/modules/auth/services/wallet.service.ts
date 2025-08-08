import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma';
import { SessionService } from './session.service';
import { ethers } from 'ethers';

export interface WalletLinkDto {
  address: string;
  signature: string;
  message: string;
  type?: 'ETHEREUM' | 'BITCOIN' | 'POLYGON' | 'BSC';
}

export interface WalletLoginDto {
  address: string;
  signature: string;
  message: string;
  nonce: string;
}

export interface WalletRegisterDto {
  address: string;
  signature: string;
  message: string;
  nonce: string;
  fullName?: string;
  email?: string;
  phone?: string;
}

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService
  ) {}

  /**
   * Link a wallet to an existing user account
   */
  async linkWallet(userId: string, walletDto: WalletLinkDto) {
    const { address, signature, message, type = 'ETHEREUM' } = walletDto;

    // Verify the signature
    const isValidSignature = await this.verifySignature(address, message, signature);
    if (!isValidSignature) {
      throw new BadRequestException('Invalid wallet signature');
    }

    // Check if wallet is already linked to another user
    const existingWallet = await this.prisma.walletAccount.findUnique({
      where: { address }
    });

    if (existingWallet && existingWallet.userId !== userId) {
      throw new BadRequestException('Wallet is already linked to another account');
    }

    // Check if user already has a primary wallet of this type
    const existingPrimaryWallet = await this.prisma.walletAccount.findFirst({
      where: {
        userId,
        type,
        isPrimary: true
      }
    });

    const isPrimary = !existingPrimaryWallet;

    // Create or update wallet account
    const walletAccount = await this.prisma.walletAccount.upsert({
      where: { address },
      create: {
        userId,
        address,
        type,
        isVerified: true,
        isPrimary,
        metadata: {
          linkedAt: new Date().toISOString(),
          verificationMethod: 'signature'
        }
      },
      update: {
        isVerified: true,
        metadata: {
          linkedAt: new Date().toISOString(),
          verificationMethod: 'signature'
        }
      }
    });

    return {
      message: 'Wallet linked successfully',
      wallet: {
        id: walletAccount.id,
        address: walletAccount.address,
        type: walletAccount.type,
        isPrimary: walletAccount.isPrimary
      }
    };
  }

  /**
   * Login using wallet signature
   */
  async loginWithWallet(loginDto: WalletLoginDto, deviceInfo?: string, ipAddress?: string, userAgent?: string) {
    const { address, signature, message, nonce } = loginDto;

    // Verify the signature contains the nonce
    if (!message.includes(nonce)) {
      throw new BadRequestException('Message must contain the provided nonce');
    }

    // Verify the signature
    const isValidSignature = await this.verifySignature(address, message, signature);
    if (!isValidSignature) {
      throw new UnauthorizedException('Invalid wallet signature');
    }

    // Find wallet account
    const walletAccount = await this.prisma.walletAccount.findUnique({
      where: { address },
      include: {
        User: {
          include: {
            UserRole: true
          }
        }
      }
    });

    if (!walletAccount || !walletAccount.isVerified) {
      throw new UnauthorizedException('Wallet not found or not verified');
    }

    // Create session
    return this.sessionService.createSession(
      walletAccount.User.id,
      'WALLET_SIGNATURE',
      { deviceInfo, ipAddress, userAgent }
    );
  }

  /**
   * Register a new user with wallet
   */
  async registerWithWallet(registerDto: WalletRegisterDto, deviceInfo?: string, ipAddress?: string, userAgent?: string) {
    const { address, signature, message, nonce, fullName, email, phone } = registerDto;

    // Verify the signature contains the nonce
    if (!message.includes(nonce)) {
      throw new BadRequestException('Message must contain the provided nonce');
    }

    // Verify the signature
    const isValidSignature = await this.verifySignature(address, message, signature);
    if (!isValidSignature) {
      throw new BadRequestException('Invalid wallet signature');
    }

    // Check if wallet is already linked
    const existingWallet = await this.prisma.walletAccount.findUnique({
      where: { address }
    });

    if (existingWallet) {
      throw new BadRequestException('Wallet is already registered');
    }

    // Check if email/phone already exists
    if (email || phone) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            email ? { email } : {},
            phone ? { phone } : {}
          ].filter(condition => Object.keys(condition).length > 0)
        }
      });

      if (existingUser) {
        throw new BadRequestException('User with this email or phone already exists');
      }
    }

    // Create user and wallet in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          phone,
          fullName: fullName || `Wallet User ${address.substring(0, 8)}`,
          password: null, // Wallet-only users don't have passwords
          UserRole: {
            create: {
              roleName: 'user'
            }
          }
        }
      });

      // Create wallet account
      const walletAccount = await tx.walletAccount.create({
        data: {
          userId: user.id,
          address,
          type: 'ETHEREUM',
          isVerified: true,
          isPrimary: true,
          metadata: {
            registeredAt: new Date().toISOString(),
            verificationMethod: 'signature'
          }
        }
      });

      return { user, walletAccount };
    });

    // Create session
    const sessionData = await this.sessionService.createSession(
      result.user.id,
      'WALLET_REGISTRATION',
      { deviceInfo, ipAddress, userAgent }
    );

    return {
      ...sessionData,
      wallet: {
        address: result.walletAccount.address,
        type: result.walletAccount.type
      }
    };
  }

  /**
   * Get user's linked wallets
   */
  async getUserWallets(userId: string) {
    return this.prisma.walletAccount.findMany({
      where: { userId },
      select: {
        id: true,
        address: true,
        type: true,
        isVerified: true,
        isPrimary: true,
        createdAt: true
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  /**
   * Unlink a wallet from user account
   */
  async unlinkWallet(userId: string, walletId: string) {
    const wallet = await this.prisma.walletAccount.findFirst({
      where: {
        id: walletId,
        userId
      }
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    // Check if user has other authentication methods
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        WalletAccounts: true
      }
    });

    if (!user.password && !user.email && !user.phone && user.WalletAccounts.length === 1) {
      throw new BadRequestException('Cannot unlink the only authentication method');
    }

    await this.prisma.walletAccount.delete({
      where: { id: walletId }
    });

    return { message: 'Wallet unlinked successfully' };
  }

  /**
   * Set primary wallet
   */
  async setPrimaryWallet(userId: string, walletId: string) {
    const wallet = await this.prisma.walletAccount.findFirst({
      where: {
        id: walletId,
        userId
      }
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Remove primary status from other wallets of the same type
      await tx.walletAccount.updateMany({
        where: {
          userId,
          type: wallet.type,
          isPrimary: true
        },
        data: { isPrimary: false }
      });

      // Set this wallet as primary
      await tx.walletAccount.update({
        where: { id: walletId },
        data: { isPrimary: true }
      });
    });

    return { message: 'Primary wallet updated successfully' };
  }

  /**
   * Generate a nonce for wallet authentication
   */
  generateNonce(): string {
    return ethers.randomBytes(16);
  }

  /**
   * Generate a standard message for wallet signature
   */
  generateSignMessage(nonce: string, domain?: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    return `Sign this message to authenticate with ${domain || 'our service'}.\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;
  }

  /**
   * Verify wallet signature
   */
  private async verifySignature(address: string, message: string, signature: string): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }
}