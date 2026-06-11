import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UsersService,
  OrganisationsService,
  SessionsService,
} from '../users/services';
import { TokenService, RequestContext } from './token.service';
import { EmailService } from './email.service';
import { VerificationsService } from './verifications.service';
import { InvitationsService } from './invitations.service';
import { TwoFactorService } from './two-factor.service';
import { db } from '../../database';
import {
  invitationStatuses,
  organisations,
  branches,
} from '../../database/schema';
import { eq, isNull } from 'drizzle-orm';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { Role } from '../../common/enums/role.enum';
import { slugify } from '../../common/utils/slugify';
import { CasbinService } from '../../common/casbin';
import {
  comparePassword,
  hashPassword,
} from '../../common/utils/hash-password';
import { validatePassword } from '../../common/validators/password.validator';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly passwordFailDelayMs = 500;

  constructor(
    private usersService: UsersService,
    private organisationsService: OrganisationsService,
    private sessionsService: SessionsService,
    private tokenService: TokenService,
    private configService: ConfigService,
    private emailService: EmailService,
    private verificationsService: VerificationsService,
    @Inject(forwardRef(() => InvitationsService))
    private invitationsService: InvitationsService,
    private twoFactorService: TwoFactorService,
    private casbinService: CasbinService,
  ) {}

  private async passwordFailDelay(): Promise<void> {
    await new Promise((resolve) =>
      setTimeout(resolve, this.passwordFailDelayMs),
    );
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    if (!user.passwordHash) {
      return null;
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(
    loginDto: LoginDto,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      await this.passwordFailDelay();
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses OAuth. Please sign in with Google.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await comparePassword(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      await this.passwordFailDelay();
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      await this.verificationsService.create(user.id, 'email');
      await this.emailService.sendVerificationEmail(user.email, '');
      throw new UnauthorizedException(
        'Please verify your email before signing in. A new verification link has been sent.',
      );
    }

    const twoFactorStatus = await this.twoFactorService.getStatus(user.id);
    if (twoFactorStatus.enabled) {
      const sessionToken = await this.tokenService.generateTwoFactorToken(
        user.id,
      );
      await this.twoFactorService.sendLoginCode(user.id, user.email);
      return {
        requiresTwoFactor: true,
        sessionToken,
        message: '2FA code sent to your email',
      };
    }

    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken, sessionId } =
      await this.tokenService.generateRefreshToken(user.id, context);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
      sessionId,
    };
  }

  async verifyTwoFactorChallenge(
    sessionToken: string,
    code: string,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const { userId } =
      await this.tokenService.verifyTwoFactorToken(sessionToken);

    const isValid = await this.twoFactorService.validate(userId, code);
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken, sessionId } =
      await this.tokenService.generateRefreshToken(user.id, context);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
      sessionId,
    };
  }

  async handleGoogleLogin(googleUser: {
    googleId: string;
    email: string;
    name: string;
  }): Promise<AuthResponseDto> {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user && googleUser.email) {
      user = await this.usersService.findByEmail(googleUser.email);
      if (user) {
        await this.usersService.update(user.id, {
          googleId: googleUser.googleId,
        });
      }
    }

    if (!user) {
      const organisation =
        await this.organisationsService.findBySlug('gajan-traders');
      if (!organisation) {
        throw new BadRequestException('Organisation not found');
      }

      const passwordHash = await hashPassword(
        Math.random().toString(36),
        this.configService,
      );

      user = await this.usersService.create({
        email: googleUser.email,
        passwordHash,
        name: googleUser.name,
        role: Role.CUSTOMER,
        organisationId: organisation.id,
        googleId: googleUser.googleId,
        emailVerified: true,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken } =
      await this.tokenService.generateRefreshToken(user.id, {
        ip: 'unknown',
        userAgent: 'google-oauth',
      });

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async register(
    registerDto: RegisterDto,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const passwordErrors = validatePassword(registerDto.password);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors.join('. '));
    }

    let organisation;
    if (registerDto.organisationName) {
      organisation = await this.organisationsService.create({
        name: registerDto.organisationName,
        slug: slugify(registerDto.organisationName),
      });
    } else {
      organisation =
        await this.organisationsService.findBySlug('gajan-traders');
      if (!organisation) {
        throw new BadRequestException(
          'Organisation not found. Please contact support.',
        );
      }
    }

    const configService = this.configService;
    const passwordHash = await hashPassword(
      registerDto.password,
      configService,
    );

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name!,
      organisationId: organisation.id,
      emailVerified: false,
    });

    const token = await this.verificationsService.create(user.id, 'email');
    await this.emailService.sendVerificationEmail(user.email, token);

    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken } =
      await this.tokenService.generateRefreshToken(user.id, context);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(
    refreshToken: string,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token required');
    }

    const { sessionId, userId } =
      await this.tokenService.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const { token: newRefreshToken, sessionId: newSessionId } =
      await this.tokenService.rotateRefreshToken(refreshToken, context);
    const accessToken = await this.tokenService.generateAccessToken(
      user,
      newSessionId,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
      sessionId: newSessionId,
    };
  }

  async logout(
    userId: string,
    sessionId?: string,
  ): Promise<{ message: string }> {
    if (sessionId) {
      await this.sessionsService.revoke(sessionId);
    } else {
      await this.sessionsService.revokeAllUserSessions(userId);
    }
    return { message: 'Logged out successfully' };
  }

  async logoutAllDevices(
    userId: string,
  ): Promise<{ message: string; sessionsRevoked: number }> {
    const sessions = await this.sessionsService.findByUserId(userId);
    await this.sessionsService.revokeAllUserSessions(userId);
    return {
      message: 'Logged out from all devices',
      sessionsRevoked: sessions.length,
    };
  }

  async getSessions(userId: string) {
    return this.sessionsService.findByUserId(userId);
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await this.sessionsService.findByUserId(userId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      await this.sessionsService.revoke(sessionId);
    }
  }

  async revokeOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<{ message: string; sessionsRevoked: number }> {
    const sessions = await this.sessionsService.findByUserId(userId);
    await this.sessionsService.revokeAllOtherSessions(userId, currentSessionId);
    return {
      message: 'All other sessions revoked',
      sessionsRevoked: sessions.filter((s) => s.id !== currentSessionId).length,
    };
  }

  async googleLogin(
    googleUser: any,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user && googleUser.email) {
      user = await this.usersService.findByGoogleIdOrEmail(
        googleUser.googleId,
        googleUser.email,
      );
    }

    if (!user) {
      throw new BadRequestException(
        'No account found. Please register with email/password first, then link your Google account.',
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    if (!user.emailVerified && googleUser.emailVerified) {
      await this.usersService.update(user.id, { emailVerified: true });
      user = await this.usersService.findById(user.id);
    }

    if (!user.emailVerified) {
      await this.verificationsService.create(user.id, 'email');
      await this.emailService.sendVerificationEmail(user.email, '');
      throw new UnauthorizedException(
        'Please verify your email before signing in. A new verification link has been sent.',
      );
    }

    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken } =
      await this.tokenService.generateRefreshToken(user.id, context);

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  private sanitizeUser(user: any): {
    id: string;
    email: string;
    name: string;
    role: string;
    organisationId: string | null;
  } {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organisationId: user.organisationId,
    };
  }

  async disable2fa(userId: string, password: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.passwordHash) {
      throw new BadRequestException('Unable to verify identity');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new BadRequestException('Invalid password');
    }

    await this.twoFactorService.disable(userId);
  }

  async registerWithInvitation(
    token: string,
    password: string,
    name: string,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    const invitation = await this.invitationsService.verify(token);
    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    const existingUser = await this.usersService.findByEmail(invitation.email);
    if (existingUser) {
      throw new BadRequestException(
        'An account already exists with this email. Please login instead.',
      );
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors.join('. '));
    }

    const passwordHash = await hashPassword(password, this.configService);

    const user = await this.usersService.create({
      email: invitation.email,
      passwordHash,
      name,
      role: invitation.role as Role,
      organisationId: invitation.organisationId,
      branchId: invitation.branchId,
      emailVerified: true,
    });

    await this.invitationsService.accept(invitation.id, user.id);

    if (invitation.role === 'staff' && invitation.branchId) {
      await this.casbinService.setUserBranchPermissions(
        user.id,
        invitation.branchId,
        'staff',
      );
    }

    const organisation = await this.organisationsService.findById(
      invitation.organisationId,
    );

    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken } =
      await this.tokenService.generateRefreshToken(user.id, context);

    await this.emailService.sendWelcomeEmail(
      user.email,
      name,
      organisation?.name || 'your organisation',
    );

    return {
      accessToken,
      refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async createInvitation(
    organisationId: string,
    createdBy: string,
    dto: { email: string; role: 'admin' | 'staff'; branchId: string },
    inviterName: string,
    organisationName: string,
  ) {
    try {
      return await this.invitationsService.create(
        organisationId,
        createdBy,
        dto,
        inviterName,
        organisationName,
      );
    } catch (error: any) {
      throw new BadRequestException(
        error.message || 'Failed to create invitation',
      );
    }
  }

  async listInvitations(organisationId?: string) {
    let invitations;
    if (organisationId) {
      invitations =
        await this.invitationsService.findByOrganisation(organisationId);
    } else {
      invitations = await this.invitationsService.findAllPending();
    }

    const result: any[] = [];
    for (const inv of invitations) {
      const org = await db.query.organisations.findFirst({
        where: eq(organisations.id, inv.organisationId),
      });
      let branchName: string | null = null;
      if (inv.branchId) {
        const branch = await db.query.branches.findFirst({
          where: eq(branches.id, inv.branchId),
        });
        branchName = branch?.name ?? null;
      }
      result.push({
        ...inv,
        organisationName: org?.name || 'Unknown',
        branchName,
      });
    }
    return result.map(({ token, ...inv }) => inv);
  }

  async deleteInvitation(invitationId: string) {
    await this.invitationsService.delete(invitationId);
  }

  async resendInvitation(invitationId: string) {
    return this.invitationsService.resend(invitationId);
  }

  async customerRegister(
    email: string,
    password: string,
    name: string | undefined,
    phoneNumber: string | undefined,
    organisationSlug: string | undefined,
    context: RequestContext,
  ): Promise<AuthResponseDto> {
    // Check for duplicate email
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new BadRequestException(
        'An account already exists with this email. Please login instead.',
      );
    }

    // Check for duplicate phone number if provided
    if (phoneNumber) {
      const existingPhone =
        await this.usersService.findByPhoneNumber(phoneNumber);
      if (existingPhone) {
        throw new BadRequestException(
          'This phone number is already registered. Please use a different number.',
        );
      }
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      throw new BadRequestException(passwordErrors.join('. '));
    }

    const passwordHash = await hashPassword(password, this.configService);

    // Auto-assign organisation by email domain first, then fall back to slug
    let organisation;
    if (organisationSlug) {
      organisation =
        await this.organisationsService.findBySlug(organisationSlug);
    } else {
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (emailDomain) {
        organisation =
          await this.organisationsService.findByTrackingDomain(emailDomain);
      }
      if (!organisation) {
        organisation =
          await this.organisationsService.findBySlug('gajan-traders');
      }
    }
    if (!organisation) {
      throw new BadRequestException(
        'Organisation not found. Please contact support.',
      );
    }

    const user = await this.usersService.create({
      email,
      passwordHash,
      name: name || email.split('@')[0],
      phoneNumber,
      role: Role.CUSTOMER,
      organisationId: organisation.id,
      isActive: false,
      emailVerified: false,
    });

    const verificationToken = await this.verificationsService.create(
      user.id,
      'email',
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    // Auto-login after registration so user can access onboarding
    const accessToken = await this.tokenService.generateAccessToken(user);
    const { token: refreshToken } =
      await this.tokenService.generateRefreshToken(user.id, context);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organisationId: user.organisationId,
      },
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }
}
