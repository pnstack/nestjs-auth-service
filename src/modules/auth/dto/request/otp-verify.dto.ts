import { ApiProperty } from '@nestjs/swagger';

export class OtpVerifyRequestDto {
  @ApiProperty({
    description: 'The identifier for the OTP, typically an email or phone number',
    example: 'abc@gmail.com',
  })
  username: string;

  @ApiProperty({
    description: 'The OTP code to verify',
    example: '123456',
  })
  otp: string;
}
