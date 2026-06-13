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
  Query,
  Param,
  Delete,
  Redirect,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiResponseOptions,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import {
  LoginDto,
  RegisterDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  InviteRegisterDto,
  TwoFactorChallengeDto,
  TwoFactorVerifyDto,
  TwoFactorDisableDto,
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasbinGuard, Require, CasbinService } from '../../common/casbin';
import { Role, isAdminRole } from '../../common/enums/role.enum';
import { ThrottlerGuard, Throttle, ThrottlerModule } from '@nestjs/throttler';
import { EmailService } from './email.service';
import { VerificationsService } from './verifications.service';
import { TwoFactorService } from './two-factor.service';
import { UsersService, OrganisationsService } from '../users/services';
import { hashPassword } from '../../common/utils/hash-password';
import { validatePassword } from '../../common/validators/password.validator';
import { ConfigService } from '@nestjs/config';

const REFRESH_COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || '.gajantraders.com';

function getRefreshCookieOptions(): Record<string, unknown> {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(isProduction ? { domain: REFRESH_COOKIE_DOMAIN } : {}),
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly verificationsService: VerificationsService,
    private readonly twoFactorService: TwoFactorService,
    private readonly usersService: UsersService,
    private readonly organisationsService: OrganisationsService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly casbinService: CasbinService,
  ) {}

  private get frontendUrl(): string {
    return this.configService.get('FRONTEND_URL', 'http://localhost:3000');
  }

  private get googleCallbackUrl(): string {
    return this.configService.get(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/auth/google/callback',
    );
  }

  private getRefreshToken(req: ExpressRequest) {
    const cookieToken = req.cookies?.refresh_token;
    if (cookieToken) return cookieToken;

    if (req.body && req.body.refreshToken) {
      return req.body.refreshToken;
    }

    return null;
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, getRefreshCookieOptions());
  }

  private clearRefreshCookie(res: Response) {
    res.clearCookie('refresh_token', { path: '/' });
  }

  private extractContext(req: ExpressRequest) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        'unknown';
    return {
      ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register with invitation token' })
  @ApiBody({ type: InviteRegisterDto })
  async registerWithInvitation(
    @Body() dto: InviteRegisterDto,
    @Req() req: ExpressRequest,
  ) {
    const result = await this.authService.registerWithInvitation(
      dto.token,
      dto.password,
      dto.name,
      this.extractContext(req),
    );
    return result;
  }

  @Public()
  @Post('customer-register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Customer self-registration with customer role' })
  @ApiBody({ type: RegisterDto })
  async customerRegister(@Body() dto: RegisterDto, @Req() req: ExpressRequest) {
    const result = await this.authService.customerRegister(
      dto.email,
      dto.password,
      dto.name,
      dto.phoneNumber,
      dto.organisationSlug,
      this.extractContext(req),
    );
    return result;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  async login(
    @Body() dto: LoginDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.extractContext(req));
    if (result.requiresTwoFactor) {
      return {
        requiresTwoFactor: true,
        sessionToken: result.sessionToken,
        message: result.message,
      };
    }
    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('2fa/challenge')
  @ApiOperation({ summary: 'Complete 2FA verification after login' })
  async challenge2fa(
    @Body() dto: TwoFactorChallengeDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyTwoFactorChallenge(
      dto.sessionToken,
      dto.code,
      this.extractContext(req),
    );
    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      sessionId: result.sessionId,
    };
  }

  @Get('2fa/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get 2FA status for current user' })
  async get2faStatus(@Request() req: { user: { id: string } }) {
    return this.twoFactorService.getStatus(req.user.id);
  }

  @Get('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send 2FA verification code to email' })
  async setup2fa(@Request() req: { user: { id: string; email: string } }) {
    return this.twoFactorService.setup(req.user.id, req.user.email);
  }

  @Post('2fa/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify email code and enable 2FA' })
  async verify2fa(
    @Request() req: { user: { id: string } },
    @Body() dto: TwoFactorVerifyDto,
  ) {
    return this.twoFactorService.verify(req.user.id, dto.token);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable2fa(
    @Request() req: { user: { id: string } },
    @Body() dto: TwoFactorDisableDto,
  ) {
    await this.authService.disable2fa(req.user.id, dto.password);
    return { success: true };
  }

  @Post('2fa/regenerate-codes')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate backup codes' })
  async regenerate2faCodes(@Request() req: { user: { id: string } }) {
    return this.twoFactorService.regenerateBackupCodes(req.user.id);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshToken(req);
    if (!refreshToken) {
      throw new HttpException(
        'Refresh token required',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const result = await this.authService.refreshToken(
      refreshToken,
      this.extractContext(req),
    );
    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
      sessionId: result.sessionId,
    };
  }

  @Public()
  @Get('google')
  async googleAuth(@Res() res: Response) {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID || 'your-google-client-id'}&redirect_uri=${encodeURIComponent(this.googleCallbackUrl)}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
    return res.redirect(authUrl);
  }

  @Public()
  @Get('google/callback')
  @UseGuards()
  async googleCallback(
    @Request() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.user) {
      return res.redirect(`${this.frontendUrl}/login?error=google_auth_failed`);
    }

    try {
      const result = await this.authService.handleGoogleLogin(req.user);
      return res.redirect(
        `${this.frontendUrl}/dashboard?token=${result.accessToken}`,
      );
    } catch (error) {
      return res.redirect(`${this.frontendUrl}/login?error=google_auth_failed`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate current session' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id, req.user.sessionId);
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all devices' })
  async logoutAll(@Request() req: any) {
    return this.authService.logoutAllDevices(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all active sessions' })
  async getSessions(@Request() req: any) {
    const sessions = await this.authService.getSessions(req.user.id);
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === req.user.sessionId,
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  async revokeSession(@Param('id') id: string, @Request() req: any) {
    await this.authService.revokeSession(req.user.id, id);
    return { message: 'Session revoked successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all sessions except current' })
  async revokeOtherSessions(@Request() req: any) {
    return this.authService.revokeOtherSessions(
      req.user.id,
      req.user.sessionId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile with permissions' })
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    const permissions = await this.casbinService.getPermissionsForRole(
      user?.role || '',
    );
    return {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      phoneNumber: user?.phoneNumber,
      organisationId: user?.organisationId,
      branchId: user?.branchId || null,
      emailVerified: user?.emailVerified,
      isActive: user?.isActive,
      createdAt: user?.createdAt,
      permissions,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('permissions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user permissions for frontend (Casbin.js format)',
  })
  async getPermissions(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    const role = user?.role || '';
    const permissions = await this.casbinService.getPermissionsForRole(role);
    return { permissions };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile (name, phone)' })
  async updateProfile(
    @Request() req: any,
    @Body() body: { name?: string; phoneNumber?: string },
  ) {
    const user = await this.usersService.update(req.user.id, {
      name: body.name,
      phoneNumber: body.phoneNumber ?? null,
    });
    return {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      phoneNumber: user?.phoneNumber,
      organisationId: user?.organisationId,
      branchId: user?.branchId || null,
      emailVerified: user?.emailVerified,
      isActive: user?.isActive,
      createdAt: user?.createdAt,
    };
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'auth', action: 'write' })
  @Post('invitations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user invitation' })
  async createInvitation(
    @Body()
    dto: {
      email: string;
      role: 'admin' | 'staff';
      organisationId?: string;
      branchId: string;
    },
    @Request() req: any,
  ) {
    if (!isAdminRole(req.user.role)) {
      throw new HttpException(
        'Only admins can create invitations',
        HttpStatus.FORBIDDEN,
      );
    }

    if (dto.role === 'staff' && !dto.branchId) {
      throw new HttpException(
        'Branch is required for staff invitations',
        HttpStatus.BAD_REQUEST,
      );
    }

    const targetOrganisationId =
      req.user.role === Role.SUPERADMIN
        ? dto.organisationId
        : req.user.organisationId || dto.organisationId;
    if (!targetOrganisationId) {
      throw new HttpException(
        'Organisation ID is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    const inviter = await this.usersService.findById(req.user.id);
    const organisation =
      await this.organisationsService.findById(targetOrganisationId);

    return this.authService.createInvitation(
      targetOrganisationId,
      req.user.id,
      dto,
      inviter?.name || 'Admin',
      organisation?.name || 'your organisation',
    );
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'auth', action: 'read' })
  @Get('invitations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending invitations' })
  async listInvitations(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;

    let targetOrgId: string | undefined;
    if (req.user.role === Role.SUPERADMIN) {
      targetOrgId = organisationId || undefined;
    } else {
      targetOrgId = req.user.organisationId || organisationId;
    }
    if (!targetOrgId && req.user.role !== Role.SUPERADMIN) {
      return { data: [], total: 0, page: 1, totalPages: 0 };
    }

    const invitations = await this.authService.listInvitations(targetOrgId);

    // Apply filters
    let filtered = [...invitations];
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((inv) =>
        inv.email.toLowerCase().includes(searchLower),
      );
    }
    if (status) {
      const now = new Date();
      filtered = filtered.filter((inv) => {
        const isExpired = new Date(inv.expiresAt) <= now;
        const isAccepted = !!inv.acceptedAt;
        if (status === 'pending') return !isAccepted && !isExpired;
        if (status === 'accepted') return isAccepted;
        if (status === 'expired') return !isAccepted && isExpired;
        return true;
      });
    }
    if (role) {
      filtered = filtered.filter((inv) => inv.role === role);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = filtered.slice(
      (pageNum - 1) * limitNum,
      pageNum * limitNum,
    );

    return { data: paginated, total, page: pageNum, totalPages };
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'auth', action: 'delete' })
  @Delete('invitations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete invitation' })
  async deleteInvitation(@Param('id') id: string, @Request() req: any) {
    await this.authService.deleteInvitation(id);
    return { message: 'Invitation deleted' };
  }

  @UseGuards(JwtAuthGuard, CasbinGuard)
  @Require({ resource: 'auth', action: 'write' })
  @Post('invitations/:id/resend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend invitation email' })
  async resendInvitation(@Param('id') id: string) {
    await this.authService.resendInvitation(id);
    return { message: 'Invitation resent' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address and login' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = await this.verificationsService.verify(dto.token, 'email');
    if (!userId) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.usersService.update(userId, {
      emailVerified: true,
      isActive: true,
    });

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken } =
      await this.tokenService.generateRefreshToken(
        user.id,
        this.extractContext(req),
      );

    this.setRefreshCookie(res, refreshToken);
    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organisationId: user.organisationId,
      },
    };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
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

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 86400000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new HttpException(
        'No account found with this email address',
        HttpStatus.NOT_FOUND,
      );
    }
    const token = await this.verificationsService.create(
      user.id,
      'password-reset',
    );
    await this.emailService.sendPasswordResetEmail(user.email, token);
    return { message: 'Password reset email sent' };
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const userId = await this.verificationsService.verify(
      dto.token,
      'password-reset',
    );
    if (!userId) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordErrors = validatePassword(dto.newPassword);
    if (passwordErrors.length > 0) {
      throw new HttpException(
        passwordErrors.join('. '),
        HttpStatus.BAD_REQUEST,
      );
    }

    const passwordHash = await hashPassword(
      dto.newPassword,
      this.configService,
    );
    await this.usersService.update(userId, { passwordHash });
    return { message: 'Password reset successfully' };
  }
}
