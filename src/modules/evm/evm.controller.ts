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
} from './dto/create-wallet.dto';
import { EvmService } from './evm.service';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('EVM')
@Controller('evm')
export class EvmController {
  constructor(private readonly evmService: EvmService) {}

  @Post('wallet')
  @ApiOperation({ summary: 'Create a new Ethereum wallet' })
  @ApiResponse({
    status: 201,
    description: 'Wallet created successfully',
    type: CreateWalletResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request',
  })
  async createWallet(
    @Body() createWalletDto: CreateWalletRequestDto
  ): Promise<CreateWalletResponseDto> {
    return this.evmService.createWallet(createWalletDto);
  }

  @Post('wallet/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({
    status: 200,
    description: 'Wallet balance retrieved successfully',
    type: GetBalanceResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid address or network error',
  })
  async getWalletBalance(
    @Body() getBalanceDto: GetBalanceRequestDto
  ): Promise<GetBalanceResponseDto> {
    return this.evmService.getWalletBalance(getBalanceDto);
  }

  @Post('wallet/sign')
  @ApiOperation({ summary: 'Sign a message with wallet private key' })
  @ApiResponse({
    status: 200,
    description: 'Message signed successfully',
    type: SignMessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid private key or signing error',
  })
  async signMessage(
    @Body() signMessageDto: SignMessageRequestDto
  ): Promise<SignMessageResponseDto> {
    return this.evmService.signMessage(signMessageDto);
  }

  @Post('wallet/verify')
  @ApiOperation({ summary: 'Verify a message signature' })
  @ApiResponse({
    status: 200,
    description: 'Signature verification completed',
    type: VerifySignatureResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid signature format',
  })
  async verifySignature(
    @Body() verifySignatureDto: VerifySignatureRequestDto
  ): Promise<VerifySignatureResponseDto> {
    return this.evmService.verifySignature(verifySignatureDto);
  }

  @Post('wallet/tokens')
  @ApiOperation({ summary: 'Get ERC-20 tokens owned by wallet' })
  @ApiResponse({
    status: 200,
    description: 'ERC-20 tokens retrieved successfully',
    type: GetTokensResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid address or network error',
  })
  async getWalletTokens(@Body() getTokensDto: GetTokensRequestDto): Promise<GetTokensResponseDto> {
    return this.evmService.getWalletTokens(getTokensDto);
  }
}
