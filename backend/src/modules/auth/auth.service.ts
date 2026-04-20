import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, OrganisationsService, SessionsService } from '../users/services';
import { EmailQueueService } from '../email/email-queue.service';
import { EmailService } from './email.service';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';
import { Role } from '../../common/enums/role.enum';
import { slugify } from '../../common/utils/slugify';
import { comparePassword, hashPassword } from '../../common/utils/hash-password';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private organisationsService: OrganisationsService,
    private sessionsService: SessionsService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailQueueService: EmailQueueService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.passwordHash) {
      const isValid = await comparePassword(password, user.passwordHash);
      if (isValid) {
        const { passwordHash, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(user: any): Promise<AuthResponseDto> {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      organisationId: user.organisationId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.generateRefreshToken(user.id);

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
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const organisation = await this.organisationsService.create({
      name: registerDto.organisationName,
      slug: slugify(registerDto.organisationName),
    });

    const passwordHash = await hashPassword(registerDto.password);

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash,
      name: registerDto.name,
      role: registerDto.role || Role.ADMIN,
      organisationId: organisation.id,
      emailVerified: false,
    });

    this.emailService.sendWelcomeEmail(registerDto.email, registerDto.name);

    return this.login(user);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    const session = await this.sessionsService.findByRefreshToken(refreshToken);

    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.sessionsService.findByUserId(session.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const fullUser = await this.usersService.findById(session.userId);
    if (!fullUser) {
      throw new UnauthorizedException('User not found');
    }

    await this.sessionsService.revoke(session.id);

    return this.login(fullUser);
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.sessionsService.revokeByUserId(userId);
    return { message: 'Logged out successfully' };
  }

  async googleLogin(googleUser: any): Promise<AuthResponseDto> {
    let user = await this.usersService.findByGoogleId(googleUser.googleId);

    if (!user && googleUser.email) {
      user = await this.usersService.findByEmail(googleUser.email);
      if (user) {
        await this.usersService.update(user.id, { googleId: googleUser.googleId });
      }
    }

    if (!user) {
      throw new BadRequestException(
        'Please register first using email/password, then link your Google account',
      );
    }

    return this.login(user);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      {
        secret: this.configService.get('JWT_SECRET') || 'your-super-secret-key-min-32-chars',
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionsService.create({
      userId,
      refreshToken,
      expiresAt,
    });

    return refreshToken;
  }
}