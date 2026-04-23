import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { hashForStorage, generateSecureToken } from '../../common/utils/crypto.util';
import { SessionsService } from '../users/services';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organisationId: string | null;
  type: 'access';
  jti: string;
}

export interface RequestContext {
  ip: string;
  userAgent: string;
}

@Injectable()
export class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private sessionsService: SessionsService,
  ) {
    const accessSecret = this.configService.get<string>('JWT_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret || !refreshSecret) {
      throw new InternalServerErrorException('JWT secrets not configured');
    }

    this.accessTokenSecret = accessSecret;
    this.refreshTokenSecret = refreshSecret;
  }

  generateAccessToken(user: {
    id: string;
    email: string;
    role: string;
    organisationId: string | null;
  }): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organisationId: user.organisationId,
      type: 'access',
      jti: randomBytes(16).toString('hex'),
    };

    return this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: '15m',
    });
  }

  async generateRefreshToken(
    userId: string,
    context: RequestContext,
  ): Promise<string> {
    const token = generateSecureToken(64);
    const tokenHash = hashForStorage(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.sessionsService.create({
      userId,
      refreshTokenHash: tokenHash,
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ip,
    });

    return token;
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token, {
        secret: this.accessTokenSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
  }

  async verifyRefreshToken(token: string): Promise<{ sessionId: string; userId: string }> {
    const tokenHash = hashForStorage(token);
    const session = await this.sessionsService.findByTokenHash(tokenHash);

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired or been revoked');
    }

    return {
      sessionId: session.id,
      userId: session.userId,
    };
  }

  async rotateRefreshToken(
    token: string,
    context: RequestContext,
  ): Promise<string> {
    const { sessionId, userId } = await this.verifyRefreshToken(token);

    await this.sessionsService.revoke(sessionId);

    return this.generateRefreshToken(userId, context);
  }
}
