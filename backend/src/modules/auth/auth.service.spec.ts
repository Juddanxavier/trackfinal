import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {
  UsersService,
  OrganisationsService,
  SessionsService,
} from '../users/services';
import { TokenService } from './token.service';
import { EmailService } from './email.service';
import { VerificationsService } from './verifications.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let tokenService: jest.Mocked<TokenService>;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByGoogleId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  const mockOrganisationsService = {
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockSessionsService = {
    findByRefreshToken: jest.fn(),
    create: jest.fn(),
    revoke: jest.fn(),
    revokeAllUserSessions: jest.fn(),
  };

  const mockTokenService = {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockVerificationsService = {
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: OrganisationsService, useValue: mockOrganisationsService },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: VerificationsService, useValue: mockVerificationsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    tokenService = module.get(TokenService);

    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user if email and password are valid', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-id',
        email: 'test@test.com',
        passwordHash,
        name: 'Test User',
        role: 'admin' as any,
        organisationId: 'org-id',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@test.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@test.com');
      expect(result.passwordHash).toBeUndefined();
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(undefined);

      const result = await service.validateUser(
        'notfound@test.com',
        'password123',
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      mockUsersService.findByEmail.mockResolvedValue({
        id: 'user-id',
        email: 'test@test.com',
        passwordHash,
        name: 'Test User',
      });

      const result = await service.validateUser(
        'test@test.com',
        'wrongpassword',
      );

      expect(result).toBeNull();
    });
  });

  describe('logout', () => {
    it('should revoke all sessions for user', async () => {
      mockSessionsService.revokeAllUserSessions.mockResolvedValue(
        undefined as any,
      );

      const result = await service.logout('user-id');

      expect(mockSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
        'user-id',
      );
      expect(result.message).toBe('Logged out successfully');
    });
  });
});
