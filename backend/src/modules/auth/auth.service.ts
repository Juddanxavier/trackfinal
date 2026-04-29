import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
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
import { db } from '../../database';
import { invitationStatuses, organisations } from '../../database/schema';
import { eq, isNull } from 'drizzle-orm';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { Role } from '../../common/enums/role.enum';
import { slugify } from '../../common/utils/slugify';
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

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      context,
    );

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

    const organisation = await this.organisationsService.create({
      name: registerDto.organisationName,
      slug: slugify(registerDto.organisationName),
    });

    const configService = this.configService;
    const passwordHash = await hashPassword(
      registerDto.password,
      configService,
    );

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      organisationId: organisation.id,
      emailVerified: false,
    });

    const token = await this.verificationsService.create(user.id, 'email');
    await this.emailService.sendVerificationEmail(user.email, token);

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      context,
    );

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

    const newRefreshToken = await this.tokenService.rotateRefreshToken(
      refreshToken,
      context,
    );
    const accessToken = this.tokenService.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.sessionsService.revokeAllUserSessions(userId);
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

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      context,
    );

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
      emailVerified: true,
    });

    await this.invitationsService.accept(invitation.id, user.id);

    const organisation = await this.organisationsService.findById(
      invitation.organisationId,
    );

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = await this.tokenService.generateRefreshToken(
      user.id,
      context,
    );

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
    dto: { email: string; role: 'admin' | 'staff' },
    inviterName: string,
    organisationName: string,
  ) {
    return this.invitationsService.create(
      organisationId,
      createdBy,
      dto,
      inviterName,
      organisationName,
    );
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
      result.push({
        ...inv,
        organisationName: org?.name || 'Unknown',
      });
    }
    return result.map(({ token, ...inv }) => inv);
  }

  async deleteInvitation(invitationId: string) {
    await this.invitationsService.delete(invitationId);
  }
}
