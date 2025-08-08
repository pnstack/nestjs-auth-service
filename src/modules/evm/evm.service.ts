import {
  CreateWalletRequestDto,
  CreateWalletResponseDto,
  GetBalanceRequestDto,
  GetBalanceResponseDto,
  SignMessageRequestDto,
  SignMessageResponseDto,
  VerifySignatureRequestDto,
  VerifySignatureResponseDto,
  GetTokensRequestDto,
  GetTokensResponseDto,
  TokenInfoDto,
} from './dto/create-wallet.dto';
import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class EvmService {
  constructor() {}

  // create wallet
  async createWallet(createWalletDto?: CreateWalletRequestDto): Promise<CreateWalletResponseDto> {
    try {
      // Generate a random mnemonic
      const mnemonic = ethers.Wallet.createRandom().mnemonic;

      if (!mnemonic) {
        throw new Error('Failed to generate mnemonic');
      }

      // Create wallet from mnemonic
      const wallet = ethers.Wallet.fromPhrase(mnemonic.phrase);

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: mnemonic.phrase,
      };
    } catch (error) {
      throw new Error(`Failed to create wallet: ${error.message}`);
    }
  }

  // get wallet balance
  async getWalletBalance(getBalanceDto: GetBalanceRequestDto): Promise<GetBalanceResponseDto> {
    try {
      // Default to Ethereum mainnet if no RPC URL provided
      const rpcUrl = getBalanceDto.rpcUrl || 'https://eth.llamarpc.com';

      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Validate address format
      if (!ethers.isAddress(getBalanceDto.address)) {
        throw new Error('Invalid Ethereum address format');
      }

      // Get balance in Wei
      const balanceWei = await provider.getBalance(getBalanceDto.address);

      // Convert to Ether
      const balanceEth = ethers.formatEther(balanceWei);

      // Get network information
      const network = await provider.getNetwork();

      return {
        address: getBalanceDto.address,
        balanceWei: balanceWei.toString(),
        balanceEth: balanceEth,
        network: network.name,
      };
    } catch (error) {
      throw new Error(`Failed to get wallet balance: ${error.message}`);
    }
  }

  // sign message
  async signMessage(signMessageDto: SignMessageRequestDto): Promise<SignMessageResponseDto> {
    try {
      // Validate private key format
      if (!signMessageDto.privateKey.startsWith('0x') || signMessageDto.privateKey.length !== 66) {
        throw new Error('Invalid private key format');
      }

      // Create wallet from private key
      const wallet = new ethers.Wallet(signMessageDto.privateKey);

      // Sign the message
      const signature = await wallet.signMessage(signMessageDto.message);

      // Get message hash
      const messageHash = ethers.hashMessage(signMessageDto.message);

      return {
        address: wallet.address,
        message: signMessageDto.message,
        signature: signature,
        messageHash: messageHash,
      };
    } catch (error) {
      throw new Error(`Failed to sign message: ${error.message}`);
    }
  }

  // verify signature
  async verifySignature(
    verifySignatureDto: VerifySignatureRequestDto
  ): Promise<VerifySignatureResponseDto> {
    try {
      // Recover the address from the signature
      const recoveredAddress = ethers.verifyMessage(
        verifySignatureDto.message,
        verifySignatureDto.signature
      );

      // Check if the recovered address matches the expected address
      const isValid =
        recoveredAddress.toLowerCase() === verifySignatureDto.expectedAddress.toLowerCase();

      return {
        isValid: isValid,
        recoveredAddress: recoveredAddress,
        message: verifySignatureDto.message,
      };
    } catch (error) {
      // If signature verification fails, return invalid result
      return {
        isValid: false,
        recoveredAddress: '0x0000000000000000000000000000000000000000',
        message: verifySignatureDto.message,
      };
    }
  }

  // get ERC-20 tokens owned by wallet
  async getWalletTokens(getTokensDto: GetTokensRequestDto): Promise<GetTokensResponseDto> {
    try {
      // Default to Ethereum mainnet if no RPC URL provided
      const rpcUrl = getTokensDto.rpcUrl || 'https://eth.llamarpc.com';

      // Create provider
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      // Validate address format
      if (!ethers.isAddress(getTokensDto.address)) {
        throw new Error('Invalid Ethereum address format');
      }

      // Get network information
      const network = await provider.getNetwork();

      // Common ERC-20 token addresses (if no specific tokens provided)
      const defaultTokenAddresses = [
        '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
        '0xA0b86a33E6441C8C55B3B5b7C3A1A6d0B6B6D6A0', // UNI
        '0x6B175474E89094C44Da98b954EedeAC495271d0F', // DAI
        '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', // WBTC
        '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
      ];

      const tokenAddresses = getTokensDto.tokenAddresses || defaultTokenAddresses;
      const tokens: TokenInfoDto[] = [];

      // ERC-20 ABI for basic token info
      const erc20Abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function balanceOf(address) view returns (uint256)',
      ];

      for (const tokenAddress of tokenAddresses) {
        try {
          // Validate token address
          if (!ethers.isAddress(tokenAddress)) {
            continue;
          }

          // Create contract instance
          const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, provider);

          // Get token info
          const [name, symbol, decimals, balance] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals(),
            tokenContract.balanceOf(getTokensDto.address),
          ]);

          // Only include tokens with non-zero balance
          if (balance > 0) {
            const formattedBalance = ethers.formatUnits(balance, decimals);

            tokens.push({
              contractAddress: tokenAddress,
              name: name,
              symbol: symbol,
              decimals: Number(decimals),
              balanceWei: balance.toString(),
              balance: formattedBalance,
            });
          }
        } catch (error) {
          // Skip tokens that can't be queried (might not be valid ERC-20 tokens)
          continue;
        }
      }

      return {
        address: getTokensDto.address,
        tokens: tokens,
        network: network.name,
      };
    } catch (error) {
      throw new Error(`Failed to get wallet tokens: ${error.message}`);
    }
  }
}
