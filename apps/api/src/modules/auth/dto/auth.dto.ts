import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../common/enums/role.enum';
import {
  PasswordComplexity,
  PASSWORD_POLICY,
} from '../../../common/validators/password.validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@test.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd!123', description: 'User password' })
  @IsString()
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@test.com', description: 'User email address' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    example: 'SecureP@ssw0rd!123',
    description: `Password must be at least ${PASSWORD_POLICY.minLength} characters with uppercase, lowercase, number, and special character`,
  })
  @IsString()
  @MinLength(PASSWORD_POLICY.minLength)
  @MaxLength(PASSWORD_POLICY.maxLength)
  @Validate(PasswordComplexity)
  password: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'My Company',
    description: 'Organisation name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organisationName?: string;

  @ApiPropertyOptional({
    example: 'track-hq',
    description: 'Organisation slug (for customer registration)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organisationSlug?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'admin@test.com',
    description: 'Email address to reset password',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Password reset token' })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @ApiProperty({
    description: `New password - minimum ${PASSWORD_POLICY.minLength} characters with uppercase, lowercase, number, and special character`,
  })
  @IsString()
  @MinLength(PASSWORD_POLICY.minLength)
  @MaxLength(PASSWORD_POLICY.maxLength)
  @Validate(PasswordComplexity)
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiPropertyOptional({ description: 'Refresh token (if not using cookie)' })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
  verificationToken?: string;
  message?: string;
  requiresTwoFactor?: boolean;
  sessionToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    organisationId: string | null;
  };
}

export class VerifyEmailDto {
  @ApiProperty({ description: 'Email verification token' })
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}

export class TwoFactorChallengeDto {
  @ApiProperty({ description: '2FA session token from login response' })
  @IsString()
  @IsNotEmpty()
  sessionToken: string;

  @ApiProperty({ description: 'Email verification code or backup code' })
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class TwoFactorVerifyDto {
  @ApiProperty({ description: 'Email verification code' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class TwoFactorDisableDto {
  @ApiProperty({ description: 'Current password for verification' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class InviteRegisterDto {
  @ApiProperty({ description: 'Invitation token' })
  @IsString()
  @IsNotEmpty({ message: 'Invitation token is required' })
  token: string;

  @ApiProperty({
    example: 'SecureP@ssw0rd!123',
    description: `Password must be at least ${PASSWORD_POLICY.minLength} characters`,
  })
  @IsString()
  @MinLength(PASSWORD_POLICY.minLength)
  @MaxLength(PASSWORD_POLICY.maxLength)
  @Validate(PasswordComplexity)
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;
}
