import { Module, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventsGateway } from './events.gateway';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');

        if (!secret) {
          throw new InternalServerErrorException(
            'JWT_SECRET is required for WebSocket authentication',
          );
        }

        if (secret.length < 32) {
          throw new InternalServerErrorException(
            'JWT_SECRET must be at least 32 characters',
          );
        }

        if (secret.includes('placeholder') || secret.includes('change-me')) {
          throw new InternalServerErrorException(
            'JWT_SECRET cannot be a placeholder value',
          );
        }

        return {
          secret,
          signOptions: {
            expiresIn: '15m',
          },
        };
      },
    }),
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
