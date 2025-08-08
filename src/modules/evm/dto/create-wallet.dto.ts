import { ApiProperty } from '@nestjs/swagger';

export class CreateWalletResponseDto {
  @ApiProperty({
    description: 'The wallet address',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  address: string;

  @ApiProperty({
    description: 'The private key of the wallet',
    example: '0x1234567890abcdef...',
  })
  privateKey: string;

  @ApiProperty({
    description: 'The mnemonic phrase for the wallet',
    example:
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
  })
  mnemonic: string;
}

export class CreateWalletRequestDto {
  @ApiProperty({
    description: 'Optional password to encrypt the wallet',
    required: false,
    example: 'mySecurePassword123',
  })
  password?: string;
}

export class GetBalanceRequestDto {
  @ApiProperty({
    description: 'The wallet address to check balance',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  address: string;

  @ApiProperty({
    description: 'RPC URL for the Ethereum network (optional, defaults to mainnet)',
    required: false,
    example: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
  })
  rpcUrl?: string;
}

export class GetBalanceResponseDto {
  @ApiProperty({
    description: 'The wallet address',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  address: string;

  @ApiProperty({
    description: 'Balance in Wei (smallest unit)',
    example: '1000000000000000000',
  })
  balanceWei: string;

  @ApiProperty({
    description: 'Balance in Ether',
    example: '1.0',
  })
  balanceEth: string;

  @ApiProperty({
    description: 'Network name',
    example: 'mainnet',
  })
  network: string;
}

export class SignMessageRequestDto {
  @ApiProperty({
    description: 'The private key of the wallet to sign with',
    example: '0x1234567890abcdef...',
  })
  privateKey: string;

  @ApiProperty({
    description: 'The message to sign',
    example: 'Hello World!',
  })
  message: string;
}

export class SignMessageResponseDto {
  @ApiProperty({
    description: 'The wallet address that signed the message',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  address: string;

  @ApiProperty({
    description: 'The original message that was signed',
    example: 'Hello World!',
  })
  message: string;

  @ApiProperty({
    description: 'The signature of the message',
    example: '0x1234567890abcdef...',
  })
  signature: string;

  @ApiProperty({
    description: 'The message hash',
    example: '0xabcdef1234567890...',
  })
  messageHash: string;
}

export class VerifySignatureRequestDto {
  @ApiProperty({
    description: 'The original message',
    example: 'Hello World!',
  })
  message: string;

  @ApiProperty({
    description: 'The signature to verify',
    example: '0x1234567890abcdef...',
  })
  signature: string;

  @ApiProperty({
    description: 'The expected signer address',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  expectedAddress: string;
}

export class VerifySignatureResponseDto {
  @ApiProperty({
    description: 'Whether the signature is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'The recovered address from the signature',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  recoveredAddress: string;

  @ApiProperty({
    description: 'The original message',
    example: 'Hello World!',
  })
  message: string;
}

export class GetTokensRequestDto {
  @ApiProperty({
    description: 'The wallet address to get tokens for',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  address: string;

  @ApiProperty({
    description: 'RPC URL for the Ethereum network (optional, defaults to mainnet)',
    required: false,
    example: 'https://eth-mainnet.alchemyapi.io/v2/your-api-key',
  })
  rpcUrl?: string;

  @ApiProperty({
    description: 'Array of token contract addresses to check (optional)',
    required: false,
    example: [
      '0xA0b86a33E6441C8C55B3B5b7C3A1A6d0B6B6D6A0',
      '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    ],
  })
  tokenAddresses?: string[];
}

export class TokenInfoDto {
  @ApiProperty({
    description: 'Token contract address',
    example: '0xA0b86a33E6441C8C55B3B5b7C3A1A6d0B6B6D6A0',
  })
  contractAddress: string;

  @ApiProperty({
    description: 'Token name',
    example: 'Tether USD',
  })
  name: string;

  @ApiProperty({
    description: 'Token symbol',
    example: 'USDT',
  })
  symbol: string;

  @ApiProperty({
    description: 'Token decimals',
    example: 6,
  })
  decimals: number;

  @ApiProperty({
    description: 'Token balance in wei (smallest unit)',
    example: '1000000000000000000',
  })
  balanceWei: string;

  @ApiProperty({
    description: 'Token balance formatted with decimals',
    example: '1000.0',
  })
  balance: string;
}

export class GetTokensResponseDto {
  @ApiProperty({
    description: 'The wallet address',
    example: '0x742d35Cc6589C4532d21B4Dfb5F5A2A2B5F1b5F1',
  })
  address: string;

  @ApiProperty({
    description: 'Array of ERC-20 tokens owned by the wallet',
    type: [TokenInfoDto],
  })
  tokens: TokenInfoDto[];

  @ApiProperty({
    description: 'Network name',
    example: 'mainnet',
  })
  network: string;
}
