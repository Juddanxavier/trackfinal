import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import {
  UsersService,
  OrganisationsService,
  SessionsService,
} from '../users/services';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { EmailQueueService } from '../email/email-queue.service';
import { EmailService } from './email.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let organisationsService: jest.Mocked<OrganisationsService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

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
    revokeByUserId: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
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

  const mockEmailQueueService = {
    addEmailJob: jest.fn(),
  };

  const mockEmailService = {
    sendWelcomeEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: OrganisationsService, useValue: mockOrganisationsService },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailQueueService, useValue: mockEmailQueueService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    organisationsService = module.get(OrganisationsService);
    sessionsService = module.get(SessionsService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

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

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@test.com',
        name: 'Test User',
        role: 'admin' as any,
        organisationId: 'org-id',
      };

      mockJwtService.sign.mockReturnValue('access-token');
      mockSessionsService.create.mockResolvedValue({ id: 'session-id' } as any);

      const result = await service.login(mockUser);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('register', () => {
    it('should throw BadRequestException if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'existing@test.com',
          password: 'password123',
          name: 'Test User',
          organisationName: 'Test Org',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create user with organisation', async () => {
      mockUsersService.findByEmail.mockResolvedValue(undefined);
      mockOrganisationsService.create.mockResolvedValue({
        id: 'org-id',
        name: 'Test Org',
        slug: 'test-org',
      } as any);
      mockUsersService.create.mockResolvedValue({
        id: 'user-id',
        email: 'new@test.com',
        name: 'New User',
        role: 'admin',
        organisationId: 'org-id',
      } as any);
      mockJwtService.sign.mockReturnValue('access-token');
      mockSessionsService.create.mockResolvedValue({ id: 'session-id' } as any);

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123',
        name: 'New User',
        organisationName: 'Test Org',
      } as any);

      expect(result.user.email).toBe('new@test.com');
      expect(mockOrganisationsService.create).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockSessionsService.findByRefreshToken.mockResolvedValue(undefined);

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is revoked', async () => {
      mockSessionsService.findByRefreshToken.mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        revoked: true,
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(service.refreshToken('revoked-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if session is expired', async () => {
      mockSessionsService.findByRefreshToken.mockResolvedValue({
        id: 'session-id',
        userId: 'user-id',
        revoked: false,
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(service.refreshToken('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke all sessions for user', async () => {
      mockSessionsService.revokeByUserId.mockResolvedValue();

      const result = await service.logout('user-id');

      expect(mockSessionsService.revokeByUserId).toHaveBeenCalledWith(
        'user-id',
      );
      expect(result.message).toBe('Logged out successfully');
    });
  });
});
