# Comprehensive Authentication System Documentation

## Overview

This documentation covers the implementation of a comprehensive authentication system for the NestJS Auth Service with multiple authentication methods and specialized services.

## Features Implemented

### 1. Email/Phone Authentication (`EmailPhoneAuthService`)
- **Login with email or phone**: Users can authenticate using either email address or phone number
- **Registration with verification**: Support for email or phone verification during registration
- **OTP-based authentication**: Option to login using OTP instead of password
- **Verification system**: Email and phone verification with OTP

**Key Methods:**
- `loginWithEmailOrPhone()`: Handle login with email/phone and optional OTP
- `registerWithEmailOrPhone()`: Register with email/phone and send verification
- `verifyEmailOrPhone()`: Verify email/phone with OTP
- `resendVerification()`: Resend verification OTP

### 2. Enhanced OTP Service (`OtpService`)
- **Multiple OTP types**: Support for LOGIN, REGISTER, EMAIL_VERIFICATION, PHONE_VERIFICATION, PASSWORD_RESET, TWO_FACTOR
- **Database persistence**: OTP tokens stored in database with expiration and attempt tracking
- **Redis caching**: Quick access through Redis for performance
- **Anti-spam protection**: Prevents OTP flooding with cooldown periods

**Key Methods:**
- `generateOtp()`: Generate OTP for various use cases
- `verifyOtp()`: Verify OTP with attempt tracking
- `generateEmailVerificationOtp()`: Specific method for email verification
- `generatePhoneVerificationOtp()`: Specific method for phone verification

### 3. Session Management (`SessionService`)
- **Comprehensive session tracking**: Track device info, IP address, user agent
- **Multiple session types**: ACCESS, REFRESH, OTP, RESET_PASSWORD
- **Database + Redis storage**: Database for persistence, Redis for performance
- **Session invalidation**: Individual and bulk session termination

**Key Methods:**
- `createSession()`: Create new session with device tracking
- `refreshSession()`: Refresh expired access tokens
- `validateSession()`: Validate session tokens
- `invalidateSession()`: Terminate specific sessions
- `getUserActiveSessions()`: List user's active sessions

### 4. Wallet Authentication (`WalletService`)
- **Multi-chain support**: ETHEREUM, BITCOIN, POLYGON, BSC
- **Signature-based authentication**: Login and registration using wallet signatures
- **Wallet linking**: Link multiple wallets to user accounts
- **Nonce-based security**: Secure challenge-response authentication

**Key Methods:**
- `loginWithWallet()`: Login using wallet signature
- `registerWithWallet()`: Register new user with wallet
- `linkWallet()`: Link wallet to existing account
- `generateNonce()`: Generate secure nonce for signing
- `verifySignature()`: Verify wallet signatures

### 5. Passkey Authentication (`PasskeyService`)
- **WebAuthn support**: Full WebAuthn implementation for passwordless auth
- **Device management**: Track and manage multiple passkeys per user
- **Biometric authentication**: Support for fingerprint, face recognition
- **Cross-platform compatibility**: Works across devices and browsers

**Key Methods:**
- `generateRegistrationOptions()`: Start passkey registration
- `verifyRegistration()`: Complete passkey registration
- `generateAuthenticationOptions()`: Start passkey authentication
- `verifyAuthenticationAndLogin()`: Complete passkey login
- `getUserPasskeys()`: List user's registered passkeys

### 6. Enhanced OAuth Service (`OAuthService`)
- **Multiple providers**: Google, Facebook, and extensible for others
- **Account linking**: Link OAuth accounts to existing users
- **Provider management**: Manage multiple OAuth providers per user
- **State verification**: Secure OAuth flow with state validation

**Key Methods:**
- `handleOAuthLogin()`: Process OAuth authentication
- `linkOAuthProvider()`: Link OAuth account to user
- `unlinkOAuthProvider()`: Remove OAuth account link
- `getUserOAuthProviders()`: List linked providers

## API Endpoints

All new authentication endpoints are available under `/auth/v2/`:

### Email/Phone Authentication
- `POST /auth/v2/login/email-phone` - Login with email or phone
- `POST /auth/v2/register/email-phone` - Register with email or phone
- `POST /auth/v2/verify/email-phone` - Verify email or phone with OTP
- `POST /auth/v2/resend-verification` - Resend verification OTP

### OTP Authentication
- `POST /auth/v2/otp/request` - Request OTP for login
- `POST /auth/v2/otp/verify` - Verify OTP and login

### Wallet Authentication
- `GET /auth/v2/wallet/nonce` - Get nonce for wallet signing
- `POST /auth/v2/wallet/login` - Login with wallet signature
- `POST /auth/v2/wallet/register` - Register with wallet signature
- `POST /auth/v2/wallet/link` - Link wallet to account
- `GET /auth/v2/wallet/my-wallets` - Get user's wallets
- `DELETE /auth/v2/wallet/:walletId` - Unlink wallet
- `PATCH /auth/v2/wallet/:walletId/primary` - Set primary wallet

### Passkey Authentication
- `POST /auth/v2/passkey/registration/begin` - Start passkey registration
- `POST /auth/v2/passkey/registration/complete` - Complete passkey registration
- `POST /auth/v2/passkey/authentication/begin` - Start passkey authentication
- `POST /auth/v2/passkey/authentication/complete` - Complete passkey authentication
- `GET /auth/v2/passkey/my-passkeys` - Get user's passkeys
- `DELETE /auth/v2/passkey/:credentialId` - Delete passkey
- `PATCH /auth/v2/passkey/:credentialId/name` - Update passkey name

### Session Management
- `GET /auth/v2/sessions` - Get active sessions
- `DELETE /auth/v2/sessions/:sessionId` - Terminate specific session
- `DELETE /auth/v2/sessions/all` - Terminate all sessions
- `POST /auth/v2/refresh-token` - Refresh access token
- `POST /auth/v2/logout` - Logout current session

### OAuth Management
- `GET /auth/v2/oauth/providers` - Get linked OAuth providers
- `DELETE /auth/v2/oauth/provider/:providerId` - Unlink OAuth provider

## Usage Examples

### Email/Phone Login
```typescript
// Login with email
const result = await emailPhoneAuthService.loginWithEmailOrPhone({
  identifier: 'user@example.com',
  password: 'password123'
});

// Login with phone and OTP
const result = await emailPhoneAuthService.loginWithEmailOrPhone({
  identifier: '+1234567890',
  useOtp: true
});
```

### Wallet Authentication
```typescript
// Generate nonce for signing
const { nonce, message } = walletService.generateNonce();

// Login with wallet signature
const result = await walletService.loginWithWallet({
  address: '0x...',
  signature: '0x...',
  message: message,
  nonce: nonce
});
```

### Passkey Authentication
```typescript
// Start passkey registration
const options = await passkeyService.generateRegistrationOptions(userId);

// Complete registration after client signs
const result = await passkeyService.verifyRegistration({
  userId,
  response: clientResponse,
  deviceName: 'iPhone'
});
```

## Security Features

### 1. Multi-Factor Authentication
- Support for combining password + OTP
- Biometric authentication via passkeys
- Hardware security key support

### 2. Session Security
- Device fingerprinting
- IP address tracking
- Session timeout management
- Concurrent session limits

### 3. Anti-Fraud Measures
- Rate limiting on OTP requests
- Failed attempt tracking
- Account lockout protection
- Signature replay prevention

## Dependencies Added

```json
{
  "@simplewebauthn/server": "^10.0.0",
  "@simplewebauthn/types": "^10.0.0",
  "ethers": "^6.15.0"
}
```

## Migration Requirements

To fully deploy this system, you'll need to:

1. **Run database migration** to create new tables
2. **Update environment variables** with new configuration
3. **Install new dependencies** for WebAuthn and Ethers
4. **Configure Prisma client** generation
5. **Test all authentication flows** in development

## Next Steps

1. Fix remaining TypeScript compilation issues
2. Generate proper Prisma client
3. Create database migration
4. Add comprehensive tests
5. Implement rate limiting
6. Add proper error handling
7. Configure production security settings