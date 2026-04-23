import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
  Res,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EmailService } from './email.service';
import { VerificationsService } from './verifications.service';
import { UsersService } from '../users/services';

const ACCESS_COOKIE_NAME = 'access_token';
const REFRESH_COOKIE_NAME = 'refresh_token';
const isProduction = process.env.NODE_ENV === 'production';
const COOKIE_OPTIONS: any = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly verificationsService: VerificationsService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Get('csrf')
  @ApiOperation({ summary: 'Get CSRF token' })
  getCsrfToken() {
    return { csrfToken: randomUUID() };
  }

  @Public()
  @Get('check')
  @ApiOperation({
    summary: 'Check authentication status via Authorization header',
  })
  async checkAuth(@Request() req: any) {
    // Try Authorization header first
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // Fall back to cookie
    if (!token) {
      token = req.cookies?.[ACCESS_COOKIE_NAME];
    }

    if (!token) {
      throw new UnauthorizedException('Unauthorized');
    }

    try {
      const payload = this.authService['jwtService'].verify(token);
      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Unauthorized');
      }
      const user = await this.usersService.findById(payload.sub);
      return {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        role: user?.role,
        organisationId: user?.organisationId,
      };
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user with organisation' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);

    // Send verification email
    const token = await this.verificationsService.create(
      result.user.id,
      'email',
    );
    await this.emailService.sendVerificationEmail(result.user.email, token);

    return result;
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiBody({ type: LoginDto })
  async login(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user);

    // Set cookies for middleware/auth checks
    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      ...result,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const result = await this.authService.refreshToken(refreshToken);

    res.cookie(ACCESS_COOKIE_NAME, result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return result;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout current user' })
  @ApiResponse({ status: 200, description: 'Logged out successfully' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.sub);
    res.clearCookie(ACCESS_COOKIE_NAME, COOKIE_OPTIONS);
    res.clearCookie(REFRESH_COOKIE_NAME, COOKIE_OPTIONS);
    return { message: 'Logged out successfully' };
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google')
  @ApiOperation({ summary: 'Redirect to Google OAuth' })
  googleAuth() {
    // Redirects to Google OAuth
  }

  @Public()
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleAuthCallback(@Request() req: any) {
    return this.authService.googleLogin(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.sub);
    return {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      organisationId: user?.organisationId,
      emailVerified: user?.emailVerified,
    };
  }

  // Email Verification
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() body: { token: string }) {
    const userId = await this.verificationsService.verify(body.token, 'email');
    if (!userId) {
      return { message: 'Invalid or expired token' };
    }
    await this.usersService.update(userId, { emailVerified: true });
    return { message: 'Email verified successfully' };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  async resendVerification(@Body() body: { email: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) {
      return {
        message: 'If the email exists, a verification email will be sent',
      };
    }
    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }
    const token = await this.verificationsService.create(user.id, 'email');
    await this.emailService.sendVerificationEmail(user.email, token);
    return { message: 'Verification email sent' };
  }

  // Password Reset
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() body: { email: string }) {
    const user = await this.usersService.findByEmail(body.email);
    if (!user) {
      return { message: 'If the email exists, a reset email will be sent' };
    }
    const token = await this.verificationsService.create(
      user.id,
      'password-reset',
    );
    await this.emailService.sendPasswordResetEmail(user.email, token);
    return { message: 'Password reset email sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() body: { token: string; password: string }) {
    const userId = await this.verificationsService.verify(
      body.token,
      'password-reset',
    );
    if (!userId) {
      return { message: 'Invalid or expired token' };
    }
    const { hashPassword } =
      await import('../../common/utils/hash-password.js');
    const passwordHash = await hashPassword(body.password);
    await this.usersService.update(userId, { passwordHash });
    return { message: 'Password reset successfully' };
  }
}
