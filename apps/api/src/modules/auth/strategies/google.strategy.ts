import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID:
        configService.get('GOOGLE_CLIENT_ID') || 'your-google-client-id',
      clientSecret:
        configService.get('GOOGLE_CLIENT_SECRET') ||
        'your-google-client-secret',
      callbackURL:
        configService.get('GOOGLE_CALLBACK_URL') ||
        'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, displayName, emails } = profile;
    return {
      googleId: id,
      email: emails[0].value,
      name: displayName,
    };
  }
}
