import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SessionCleanupJob } from './session-cleanup.job';
import { EnvironmentValidator } from './environment.validator';
import { JwtStrategy, GoogleStrategy } from './strategies';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { EmailService } from './email.service';
import { VerificationsService } from './verifications.service';
import { InvitationsService } from './invitations.service';
import { TwoFactorService } from './two-factor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CasbinService, CasbinGuard } from '../../common/casbin';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret,
          signOptions: {
            expiresIn: '1h',
          },
        };
      },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    EnvironmentValidator,
    AuthService,
    TokenService,
    SessionCleanupJob,
    JwtStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    CasbinService,
    CasbinGuard,
    EmailService,
    VerificationsService,
    InvitationsService,
    TwoFactorService,
  ],
  exports: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    CasbinService,
    CasbinGuard,
    InvitationsService,
  ],
})
export class AuthModule {}
