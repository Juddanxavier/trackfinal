import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  organisationId: string | null;
  type: 'access' | 'refresh';
  jti?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new InternalServerErrorException(
        'JWT_SECRET environment variable is required',
      );
    }

    if (secret.length < 32) {
      throw new InternalServerErrorException(
        'JWT_SECRET must be at least 32 characters',
      );
    }

    if (secret.includes('placeholder') || secret.includes('change-me')) {
      throw new InternalServerErrorException(
        'JWT_SECRET is using a placeholder value',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): any {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      organisationId: payload.organisationId,
    };
  }
}
