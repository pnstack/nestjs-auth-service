import { ApiProperty } from '@nestjs/swagger';

export class OtpAuthRequestDto {
  @ApiProperty({
    description: 'The identifier for the OTP, typically an email or phone number',
    example: 'abc@gmail.com',
  })
  username: string;
}
