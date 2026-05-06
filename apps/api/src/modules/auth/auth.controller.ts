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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
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

const isProduction = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'none' | 'lax';
  path: string;
  maxAge: number;
} = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
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
  ) {}

  private getRefreshToken(req: ExpressRequest) {
    return req.cookies?.refresh_token;
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    console.log('Setting cookie with options:', REFRESH_COOKIE_OPTIONS);
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
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
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
    this.setRefreshCookie(res, result.refreshToken);
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
    this.setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken, user: result.user };
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
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    const userId = await this.verificationsService.verify(dto.token, 'email');
    if (!userId) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.usersService.update(userId, { emailVerified: true });
    return { message: 'Email verified successfully' };
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
