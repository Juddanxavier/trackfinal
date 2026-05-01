import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '../../common/enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (
    user: { role?: string } | null,
  ): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, { provide: Reflector, useValue: mockReflector }],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true if no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: 'customer' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true if user has required role - admin', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext({ role: 'admin' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true if user has required role - staff', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.STAFF]);
      const context = createMockExecutionContext({ role: 'staff' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not have required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext({ role: 'customer' });

      expect(() => guard.canActivate(context)).toThrow(
        'Insufficient permissions',
      );
    });

    it('should return true if user has one of required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.STAFF]);
      const context = createMockExecutionContext({ role: 'staff' });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user has no role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext({ role: undefined });

      expect(() => guard.canActivate(context)).toThrow(
        'Access denied - user has no role assigned',
      );
    });

    it('should throw UnauthorizedException if user is undefined', () => {
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
      const context = createMockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(
        'Authentication required',
      );
    });
  });
});
