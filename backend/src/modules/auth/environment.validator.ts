import {
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvironmentValidator implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];

    const recommended = [
      'BCRYPT_ROUNDS',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'TRACK17_API_KEY',
      'TRACK17_WEBHOOK_SECRET',
    ];

    const errors: string[] = [];

    for (const key of required) {
      const value = this.configService.get<string>(key);
      if (!value) {
        errors.push(`FATAL: ${key} environment variable is required`);
        continue;
      }
      if (key === 'JWT_SECRET' && value.length < 32) {
        errors.push(
          `FATAL: JWT_SECRET must be at least 32 characters, got ${value.length}`,
        );
      }
      if (key === 'JWT_REFRESH_SECRET' && value.length < 32) {
        errors.push(
          `FATAL: JWT_REFRESH_SECRET must be at least 32 characters, got ${value.length}`,
        );
      }
      const knownPlaceholders = [
        'your-super-secret-key-min-32-chars',
        'your-super-secret-jwt-refresh-key-min-32',
        'your-super-secret',
      ];

      if (
        knownPlaceholders.includes(value) ||
        value.includes('change-me') ||
        (value.includes('placeholder') && value.length < 50)
      ) {
        errors.push(
          `FATAL: ${key} is using a known placeholder value. Please set a secure secret.`,
        );
      }
    }

    const bcryptRounds = this.configService.get<string>('BCRYPT_ROUNDS');
    if (bcryptRounds) {
      const rounds = parseInt(bcryptRounds, 10);
      if (isNaN(rounds) || rounds < 10) {
        console.warn(
          `WARNING: BCRYPT_ROUNDS should be at least 10, got ${bcryptRounds}. Using default of 12.`,
        );
      }
    }

    if (errors.length > 0) {
      throw new InternalServerErrorException(errors.join('\n'));
    }
  }
}
