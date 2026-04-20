import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';
import { ConfigService } from '@nestjs/config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        JWT_SECRET: 'test-secret-key-min-32-chars-long',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return payload with user info', async () => {
      const payload = {
        sub: 'user-id-123',
        email: 'test@test.com',
        role: 'admin',
        organisationId: 'org-id-456',
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 'user-id-123',
        email: 'test@test.com',
        role: 'admin',
        organisationId: 'org-id-456',
      });
    });

    it('should handle payload with null organisationId', async () => {
      const payload = {
        sub: 'user-id-123',
        email: 'test@test.com',
        role: 'customer',
        organisationId: null,
      };

      const result = await strategy.validate(payload);

      expect(result).toEqual({
        sub: 'user-id-123',
        email: 'test@test.com',
        role: 'customer',
        organisationId: null,
      });
    });
  });
});