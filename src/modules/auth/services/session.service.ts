import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/shared/prisma';
import { RedisdbService } from '@/shared/database/redisdb/redisdb.service';

type SessionType = 'ACCESS' | 'REFRESH' | 'OTP' | 'RESET_PASSWORD';

export interface SessionData {
  userId: string;
  roles: string[];
  permissions?: string[];
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface CreateSessionOptions {
  type?: SessionType;
  expiresIn?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisdbService: RedisdbService
  ) {}

  async createSession(
    userId: string, 
    loginMethod: string, 
    options: CreateSessionOptions = {}
  ) {
    const {
      type = 'ACCESS',
      expiresIn,
      deviceInfo,
      ipAddress,
      userAgent
    } = options;

    // Get user with roles
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserRole: {
          include: {
            Role: {
              include: {
                RolePermission: {
                  include: {
                    Permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = user.UserRole.map(ur => ur.roleName);
    const permissions = user.UserRole.flatMap(ur => 
      ur.Role.RolePermission.map(rp => rp.Permission.name)
    );

    // Create JWT payload
    const payload = {
      userId,
      roles,
      permissions,
      sessionType: type,
      loginMethod
    };

    // Generate tokens
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresIn || '15m'
    });

    const refreshToken = this.jwtService.sign(
      { userId, sessionType: 'REFRESH' },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d'
      }
    );

    // Calculate expiration dates
    const accessExpiresAt = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes
    const refreshExpiresAt = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days

    // Store sessions in database
    const [accessSession, refreshSession] = await Promise.all([
      this.prisma.session.create({
        data: {
          userId,
          token: accessToken,
          type: 'ACCESS',
          deviceInfo,
          ipAddress,
          userAgent,
          expiresAt: accessExpiresAt
        }
      }),
      this.prisma.session.create({
        data: {
          userId,
          token: refreshToken,
          type: 'REFRESH',
          deviceInfo,
          ipAddress,
          userAgent,
          expiresAt: refreshExpiresAt
        }
      })
    ]);

    // Store in Redis for quick access
    await Promise.all([
      this.redisdbService.set(`session:${accessToken}`, JSON.stringify({
        userId,
        roles,
        permissions,
        sessionId: accessSession.id
      }), 15 * 60), // 15 minutes
      this.redisdbService.set(`refresh:${refreshToken}`, JSON.stringify({
        userId,
        sessionId: refreshSession.id
      }), 7 * 24 * 60 * 60) // 7 days
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        picture: user.picture,
        roles,
        permissions
      }
    };
  }

  async refreshSession(refreshToken: string, deviceInfo?: string, ipAddress?: string, userAgent?: string) {
    // Check Redis first
    const cachedData = await this.redisdbService.get(`refresh:${refreshToken}`);
    let sessionData;

    if (cachedData) {
      sessionData = JSON.parse(cachedData);
    } else {
      // Check database
      const session = await this.prisma.session.findUnique({
        where: { token: refreshToken },
        include: { User: true }
      });

      if (!session || !session.isActive || new Date() > session.expiresAt) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      sessionData = { userId: session.userId, sessionId: session.id };
    }

    // Invalidate old sessions
    await this.invalidateUserSessions(sessionData.userId, 'ACCESS');

    // Create new session
    return this.createSession(sessionData.userId, 'REFRESH_TOKEN', {
      deviceInfo,
      ipAddress,
      userAgent
    });
  }

  async validateSession(token: string): Promise<SessionData | null> {
    // Check Redis first
    const cachedData = await this.redisdbService.get(`session:${token}`);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Check database
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: {
        User: {
          include: {
            UserRole: {
              include: {
                Role: {
                  include: {
                    RolePermission: {
                      include: {
                        Permission: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!session || !session.isActive || new Date() > session.expiresAt) {
      return null;
    }

    const roles = session.User.UserRole.map(ur => ur.roleName);
    const permissions = session.User.UserRole.flatMap(ur => 
      ur.Role.RolePermission.map(rp => rp.Permission.name)
    );

    const sessionData = {
      userId: session.User.id,
      roles,
      permissions,
      deviceInfo: session.deviceInfo,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent
    };

    // Cache in Redis
    const remainingTime = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    if (remainingTime > 0) {
      await this.redisdbService.set(`session:${token}`, JSON.stringify(sessionData), remainingTime);
    }

    return sessionData;
  }

  async invalidateSession(token: string): Promise<void> {
    // Remove from Redis
    await this.redisdbService.del(`session:${token}`);
    
    // Deactivate in database
    await this.prisma.session.updateMany({
      where: { token },
      data: { isActive: false }
    });
  }

  async invalidateUserSessions(userId: string, type?: SessionType): Promise<void> {
    const whereClause: any = { userId, isActive: true };
    if (type) {
      whereClause.type = type;
    }

    // Get all active sessions
    const sessions = await this.prisma.session.findMany({
      where: whereClause,
      select: { token: true }
    });

    // Remove from Redis
    await Promise.all(
      sessions.map(session => this.redisdbService.del(`session:${session.token}`))
    );

    // Deactivate in database
    await this.prisma.session.updateMany({
      where: whereClause,
      data: { isActive: false }
    });
  }

  async getUserActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        type: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async cleanupExpiredSessions(): Promise<void> {
    // Remove expired sessions from database
    await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    // Note: Redis entries will expire automatically
  }
}