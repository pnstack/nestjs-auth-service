// Basic types to work around Prisma generation issues
export interface User {
  id: string;
  email?: string;
  password?: string;
  fullName?: string;
  address?: string;
  avatarFileId?: number;
  dateOfBirth?: Date;
  phone?: string;
  bio?: string;
  gender?: boolean;
  picture?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserRole {
  id: number;
  userId: string;
  roleName: string;
}

export interface Role {
  name: string;
  description?: string;
}

export interface Permission {
  name: string;
  description?: string;
}

export interface RolePermission {
  id: number;
  roleName: string;
  permissionName: string;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  type: 'ACCESS' | 'REFRESH' | 'OTP' | 'RESET_PASSWORD';
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpToken {
  id: string;
  userId?: string;
  identifier: string;
  token: string;
  type: 'LOGIN' | 'REGISTER' | 'PHONE_VERIFICATION' | 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'TWO_FACTOR';
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface WalletAccount {
  id: string;
  userId: string;
  address: string;
  type: 'ETHEREUM' | 'BITCOIN' | 'POLYGON' | 'BSC';
  isVerified: boolean;
  isPrimary: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasskeyCredential {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: bigint;
  deviceType?: string;
  backed: boolean;
  transports?: any;
  createdAt: Date;
  lastUsedAt: Date;
}

export interface AuthProvider {
  providerId: string;
  name: string;
  description?: string;
  createAt: Date;
}

export interface AuthProviderUser {
  id: number;
  AuthProviderId?: string;
  userId?: string;
  createAt: Date;
}

// Basic Prisma namespace with common types
export namespace Prisma {
  export interface UserCreateInput {
    id?: string;
    email?: string;
    password?: string;
    fullName?: string;
    address?: string;
    avatarFileId?: number;
    dateOfBirth?: Date;
    phone?: string;
    bio?: string;
    gender?: boolean;
    picture?: string;
    isEmailVerified?: boolean;
    isPhoneVerified?: boolean;
    twoFactorEnabled?: boolean;
    Provider?: any;
    UserRole?: any;
    Sessions?: any;
    WalletAccounts?: any;
    PasskeyCredentials?: any;
    OtpTokens?: any;
  }

  export interface UserCreateArgs {
    data: UserCreateInput;
    select?: any;
    include?: any;
  }

  export interface UserUpdateArgs {
    where: any;
    data: any;
    select?: any;
    include?: any;
  }

  export interface UserDeleteArgs {
    where: any;
  }

  export interface UserAggregateArgs {
    where?: any;
    orderBy?: any;
    cursor?: any;
    take?: number;
    skip?: number;
  }

  export type SelectSubset<T, U> = {
    [K in keyof T]: K extends keyof U ? T[K] : never;
  };

  export interface GetUserAggregateType<T> {
    _count: any;
    _avg: any;
    _sum: any;
    _min: any;
    _max: any;
  }

  export interface Middleware {
    (params: any, next: any): Promise<any>;
  }

  export class PrismaClientKnownRequestError extends Error {
    code: string;
    meta?: any;
    clientVersion: string;
    
    constructor(message: string, options: any) {
      super(message);
      this.code = options.code;
      this.meta = options.meta;
      this.clientVersion = options.clientVersion;
    }
  }
}

// Mock PrismaService for compilation
export class PrismaService {
  user: any;
  userRole: any;
  role: any;
  permission: any;
  rolePermission: any;
  session: any;
  otpToken: any;
  walletAccount: any;
  passkeyCredential: any;
  authProvider: any;
  authProviderUser: any;

  constructor() {
    // Mock implementation
  }

  async $transaction<T>(fn: (tx: any) => Promise<T>): Promise<T> {
    return fn(this);
  }

  async enableShutdownHooks(app: any) {
    // Mock implementation
  }
}