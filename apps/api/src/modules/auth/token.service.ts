import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import {
  hashForStorage,
  generateSecureToken,
} from '../../common/utils/crypto.util';
import { SessionsService } from '../users/services';

export interface JwtPayload {
  sub: string;
  email: string;
  name?: string;
  role: string;
  organisationId: string | null;
  branchId?: string | null;
  type: 'access' | '2fa_session';
  jti: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface RequestContext {
  ip: string;
  userAgent: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly accessSecret: Uint8Array;
  private readonly refreshSecret: Uint8Array;

  constructor(
    private configService: ConfigService,
    private sessionsService: SessionsService,
  ) {
    const accessSecretStr = this.configService.get<string>('JWT_SECRET');
    const refreshSecretStr =
      this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecretStr || !refreshSecretStr) {
      throw new InternalServerErrorException('JWT secrets not configured');
    }

    if (accessSecretStr.length < 32) {
      throw new InternalServerErrorException(
        'JWT_SECRET must be at least 32 characters',
      );
    }

    this.accessSecret = new TextEncoder().encode(accessSecretStr);
    this.refreshSecret = new TextEncoder().encode(refreshSecretStr);
  }

  async generateAccessToken(
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      organisationId: string | null;
      branchId?: string | null;
    },
    sessionId?: string,
  ): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organisationId: user.organisationId,
      branchId: user.branchId || null,
      type: 'access',
      jti: crypto.randomUUID(),
      sessionId,
    };

    const token = await new jose.SignJWT(payload as unknown as jose.JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .setJti(payload.jti)
      .sign(this.accessSecret);

    this.logger.debug(
      `Generated access token for user ${user.id}, sessionId: ${sessionId}`,
    );
    return token;
  }

  async generateRefreshToken(
    userId: string,
    context: RequestContext,
  ): Promise<{ token: string; sessionId: string }> {
    const token = generateSecureToken(64);
    const tokenHash = hashForStorage(token);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await this.sessionsService.create({
      userId,
      refreshTokenHash: tokenHash,
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ip,
    });

    this.logger.debug(
      `Generated refresh token for user ${userId}, sessionId: ${session.id}`,
    );
    return { token, sessionId: session.id };
  }

  async generateTwoFactorToken(userId: string): Promise<string> {
    const payload = {
      sub: userId,
      type: '2fa_session' as const,
      jti: crypto.randomUUID(),
    };

    const token = await new jose.SignJWT(payload as unknown as jose.JWTPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .setJti(payload.jti)
      .sign(this.accessSecret);

    return token;
  }

  async verifyTwoFactorToken(token: string): Promise<{ userId: string }> {
    try {
      const { payload } = await jose.jwtVerify(token, this.accessSecret, {
        clockTolerance: 30,
      });

      if (payload.type !== '2fa_session') {
        throw new UnauthorizedException('Invalid token type');
      }

      return { userId: payload.sub as string };
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        throw new UnauthorizedException('2FA session expired');
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid 2FA session');
    }
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const { payload } = await jose.jwtVerify(token, this.accessSecret, {
        clockTolerance: 30,
      });

      if (payload.type !== 'access') {
        this.logger.warn('Invalid token type provided');
        throw new UnauthorizedException('Invalid token type');
      }

      return payload as unknown as JwtPayload;
    } catch (error) {
      if (error instanceof jose.errors.JWTExpired) {
        this.logger.debug('Access token expired');
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof jose.errors.JWTClaimValidationFailed) {
        this.logger.warn('Token claim validation failed:', error.message);
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
        this.logger.warn('Token signature verification failed');
        throw new UnauthorizedException('Invalid token');
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Token verification error:', error);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  async verifyRefreshToken(
    token: string,
  ): Promise<{ sessionId: string; userId: string }> {
    try {
      const tokenHash = hashForStorage(token);
      const session = await this.sessionsService.findByTokenHash(tokenHash);

      if (!session) {
        this.logger.debug('Refresh token not found in database');
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (session.revoked) {
        this.logger.warn(`Attempted use of revoked session: ${session.id}`);
        // Security: If someone tries to use a revoked token, revoke all sessions for that user
        await this.sessionsService.revokeAllUserSessions(session.userId);
        throw new UnauthorizedException('Session has been revoked');
      }

      if (session.expiresAt < new Date()) {
        this.logger.debug(`Expired session attempted: ${session.id}`);
        throw new UnauthorizedException('Refresh token has expired');
      }

      this.logger.debug(`Refresh token verified for session: ${session.id}`);
      return {
        sessionId: session.id,
        userId: session.userId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Refresh token verification error:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async rotateRefreshToken(
    token: string,
    context: RequestContext,
  ): Promise<{ token: string; sessionId: string }> {
    const { sessionId, userId } = await this.verifyRefreshToken(token);

    this.logger.debug(`Rotating refresh token, revoking session: ${sessionId}`);
    await this.sessionsService.revoke(sessionId);

    return this.generateRefreshToken(userId, context);
  }
}
