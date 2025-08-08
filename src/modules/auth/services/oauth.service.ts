import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma';
import { SessionService } from './session.service';
import { ConfigService } from '@nestjs/config';

export interface OAuthUserData {
  providerId: string;
  provider: string;
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  verified: boolean;
}

export interface OAuthLoginResult {
  isNewUser: boolean;
  user: any;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class OAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Handle OAuth authentication (Google, Facebook, etc.)
   */
  async handleOAuthLogin(
    oauthData: OAuthUserData,
    deviceInfo?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<OAuthLoginResult> {
    const { providerId, provider, email, name, picture, phone, verified } = oauthData;

    // First, try to find existing OAuth provider user
    let authProviderUser = await this.prisma.authProviderUser.findFirst({
      where: {
        AuthProvider: {
          providerId: providerId
        }
      },
      include: {
        User: {
          include: {
            UserRole: true
          }
        },
        AuthProvider: true
      }
    });

    let user;
    let isNewUser = false;

    if (authProviderUser) {
      // Existing OAuth user
      user = authProviderUser.User;
      
      // Update user info if needed
      const updates: any = {};
      if (user.picture !== picture) updates.picture = picture;
      if (user.fullName !== name) updates.fullName = name;
      if (phone && user.phone !== phone) updates.phone = phone;
      
      if (Object.keys(updates).length > 0) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: updates,
          include: {
            UserRole: true
          }
        });
      }
    } else {
      // Check if user exists with same email
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        include: {
          UserRole: true,
          Provider: {
            include: {
              AuthProvider: true
            }
          }
        }
      });

      if (existingUser) {
        // Link OAuth account to existing user
        user = existingUser;
        
        // Create OAuth provider link
        await this.createOAuthProviderLink(user.id, providerId, provider);
      } else {
        // Create new user with OAuth provider
        user = await this.createUserWithOAuth(
          { email, name, picture, phone, verified },
          providerId,
          provider
        );
        isNewUser = true;
      }
    }

    // Create session
    const sessionData = await this.sessionService.createSession(
      user.id,
      `OAUTH_${provider.toUpperCase()}`,
      { deviceInfo, ipAddress, userAgent }
    );

    return {
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        picture: user.picture,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        roles: user.UserRole.map(ur => ur.roleName)
      },
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken
    };
  }

  /**
   * Link OAuth provider to existing user
   */
  async linkOAuthProvider(userId: string, oauthData: OAuthUserData) {
    const { providerId, provider, email } = oauthData;

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if OAuth account is already linked to another user
    const existingLink = await this.prisma.authProviderUser.findFirst({
      where: {
        AuthProvider: {
          providerId: providerId
        }
      }
    });

    if (existingLink && existingLink.userId !== userId) {
      throw new BadRequestException('OAuth account is already linked to another user');
    }

    // Check if email matches
    if (user.email !== email) {
      throw new BadRequestException('OAuth account email does not match user email');
    }

    // Create OAuth provider link
    await this.createOAuthProviderLink(userId, providerId, provider);

    return {
      message: `${provider} account linked successfully`,
      provider: provider
    };
  }

  /**
   * Unlink OAuth provider from user
   */
  async unlinkOAuthProvider(userId: string, providerId: string) {
    // Check if user has other authentication methods
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        Provider: {
          include: {
            AuthProvider: true
          }
        },
        WalletAccounts: true,
        PasskeyCredentials: true
      }
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Ensure user has other authentication methods
    const hasPassword = !!user.password;
    const hasOtherProviders = user.Provider.length > 1;
    const hasWallets = user.WalletAccounts.length > 0;
    const hasPasskeys = user.PasskeyCredentials.length > 0;

    if (!hasPassword && !hasOtherProviders && !hasWallets && !hasPasskeys) {
      throw new BadRequestException('Cannot unlink the only authentication method');
    }

    // Find and remove the OAuth provider link
    const providerUser = await this.prisma.authProviderUser.findFirst({
      where: {
        userId,
        AuthProvider: {
          providerId
        }
      }
    });

    if (!providerUser) {
      throw new BadRequestException('OAuth provider not linked to this user');
    }

    await this.prisma.authProviderUser.delete({
      where: { id: providerUser.id }
    });

    return {
      message: 'OAuth provider unlinked successfully'
    };
  }

  /**
   * Get user's linked OAuth providers
   */
  async getUserOAuthProviders(userId: string) {
    const providers = await this.prisma.authProviderUser.findMany({
      where: { userId },
      include: {
        AuthProvider: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return providers.map(p => ({
      id: p.AuthProvider.providerId,
      name: p.AuthProvider.name,
      description: p.AuthProvider.description,
      linkedAt: p.createdAt
    }));
  }

  /**
   * Create OAuth provider link
   */
  private async createOAuthProviderLink(userId: string, providerId: string, providerName: string) {
    return this.prisma.authProviderUser.create({
      data: {
        userId,
        AuthProvider: {
          connectOrCreate: {
            where: { providerId },
            create: {
              providerId,
              name: providerName,
              description: `${providerName} OAuth Provider`
            }
          }
        }
      }
    });
  }

  /**
   * Create new user with OAuth provider
   */
  private async createUserWithOAuth(
    userData: { email: string; name: string; picture?: string; phone?: string; verified: boolean },
    providerId: string,
    provider: string
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: userData.email,
          fullName: userData.name,
          picture: userData.picture,
          phone: userData.phone,
          password: null, // OAuth users don't have passwords initially
          isEmailVerified: userData.verified,
          isPhoneVerified: !!userData.phone,
          UserRole: {
            create: {
              roleName: 'user'
            }
          }
        },
        include: {
          UserRole: true
        }
      });

      // Create OAuth provider link
      await tx.authProviderUser.create({
        data: {
          userId: user.id,
          AuthProvider: {
            connectOrCreate: {
              where: { providerId },
              create: {
                providerId,
                name: provider,
                description: `${provider} OAuth Provider`
              }
            }
          }
        }
      });

      return user;
    });
  }

  /**
   * Generate OAuth state for security
   */
  generateOAuthState(): string {
    return Buffer.from(JSON.stringify({
      timestamp: Date.now(),
      random: Math.random().toString(36).substring(2)
    })).toString('base64');
  }

  /**
   * Verify OAuth state
   */
  verifyOAuthState(state: string, maxAge: number = 10 * 60 * 1000): boolean {
    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      const age = Date.now() - decoded.timestamp;
      return age <= maxAge;
    } catch {
      return false;
    }
  }

  /**
   * Get OAuth redirect URL
   */
  getOAuthRedirectUrl(provider: string, state?: string): string {
    const baseUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const stateParam = state ? `&state=${encodeURIComponent(state)}` : '';
    return `${baseUrl}/auth/oauth/${provider}/callback${stateParam}`;
  }
}