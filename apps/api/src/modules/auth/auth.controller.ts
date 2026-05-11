import {
  Controller,
  Post,
  Body,
  Get,
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
} from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ThrottlerGuard, Throttle, ThrottlerModule } from '@nestjs/throttler';
import { EmailService } from './email.service';
import { VerificationsService } from './verifications.service';
import { UsersService, OrganisationsService } from '../users/services';
import { hashPassword } from '../../common/utils/hash-password';
import { validatePassword } from '../../common/validators/password.validator';
import { ConfigService } from '@nestjs/config';

const REFRESH_COOKIE_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge: number;
  domain?: string;
} = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService,
    private readonly verificationsService: VerificationsService,
    private readonly usersService: UsersService,
    private readonly organisationsService: OrganisationsService,
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
  ) {}

  private getRefreshToken(req: ExpressRequest) {
    return req.cookies?.refresh_token;
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
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
  async register(
    @Body() dto: InviteRegisterDto,
    @Req() req: ExpressRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.registerWithInvitation(
      dto.token,
      dto.password,
      dto.name,
      this.extractContext(req),
    );
    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Post('customer-register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Customer self-registration' })
  async customerRegister(
    @Body() dto: RegisterDto,
    @Req() req: ExpressRequest,
  ) {
    const result = await this.authService.customerRegister(
      dto.email,
      dto.password,
      dto.name,
      dto.phoneNumber,
      this.extractContext(req),
    );
    return result;
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
    if (result.refreshToken) {
      this.setRefreshCookie(res, result.refreshToken);
    }
    return { accessToken: result.accessToken, user: result.user };
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
    return { accessToken: result.accessToken, user: result.user };
  }

  @Public()
  @Get('google')
  async googleAuth(@Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID || 'your-google-client-id'}&redirect_uri=${encodeURIComponent('http://localhost:4000/api/auth/google/callback')}&response_type=code&scope=openid%20email%20profile&access_type=offline`;
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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }

    try {
      const result = await this.authService.handleGoogleLogin(req.user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/dashboard?token=${result.accessToken}`);
    } catch (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate session' })
  async logout(@Request() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    this.clearRefreshCookie(res);
    return { message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    const user = await this.usersService.findById(req.user.id);
    return {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      organisationId: user?.organisationId,
      emailVerified: user?.emailVerified,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('invitations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user invitation' })
  async createInvitation(
    @Body()
    dto: { email: string; role: 'admin' | 'staff'; organisationId?: string },
    @Request() req: any,
  ) {
    if (req.user.role !== Role.ADMIN) {
      throw new HttpException(
        'Only admins can create invitations',
        HttpStatus.FORBIDDEN,
      );
    }

    const targetOrganisationId = dto.organisationId || req.user.organisationId;
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @Get('invitations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List pending invitations' })
  async listInvitations(
    @Request() req: any,
    @Query('organisationId') organisationId?: string,
  ) {
    if (req.user.role === Role.ADMIN && !organisationId) {
      return this.authService.listInvitations();
    }
    const targetOrgId =
      req.user.role === Role.ADMIN && organisationId
        ? organisationId
        : req.user.organisationId;
    return this.authService.listInvitations(targetOrgId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('invitations/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete invitation' })
  async deleteInvitation(@Param('id') id: string, @Request() req: any) {
    await this.authService.deleteInvitation(id);
    return { message: 'Invitation deleted' };
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
    await this.usersService.update(userId, { emailVerified: true, isActive: true });
    
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      this.extractContext(req),
    );
    
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, organisationId: user.organisationId } };
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
