# Authentication Module Rewrite Plan

## Executive Summary

Rewrite the authentication module to be **foolproof** and **tightly coupled**. Address all security vulnerabilities from the audit, enforce strict input validation, eliminate hardcoded secrets, implement proper token rotation, and ensure zero authentication bypass paths.

---

## Current Issues Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 2 | Hardcoded API key, weak seed passwords |
| HIGH | 3 | Fallback JWT secret, API key in URL, OAuth bypass |
| MEDIUM | 6 | Bcrypt rounds, XSS vectors, timing attacks, no token rotation |
| LOW | 6 | Password complexity, session cleanup, CORS, Swagger |

---

## Phase 1: Core Infrastructure Hardening

### 1.1 Environment Validation Service
**File:** `backend/src/modules/auth/environment.validator.ts`

```typescript
@Injectable()
export class EnvironmentValidator implements OnModuleInit {
  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'BCRYPT_ROUNDS'];
    const optional = ['TRACK17_API_KEY', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];

    for (const key of required) {
      const value = this.configService.get(key);
      if (!value) {
        throw new Error(`FATAL: ${key} environment variable is required`);
      }
      if (key === 'JWT_SECRET' && value.length < 32) {
        throw new Error(`FATAL: JWT_SECRET must be at least 32 characters`);
      }
      if (key === 'JWT_REFRESH_SECRET' && value.length < 32) {
        throw new Error(`FATAL: JWT_REFRESH_SECRET must be at least 32 characters`);
      }
    }
  }
}
```

**Actions:**
- Eliminate ALL fallback secrets
- Throw fatal error on startup if any required secret is missing or weak
- Move `TRACK17_API_KEY` to vault/ secrets manager (never in .env)

### 1.2 Password Hashing Upgrade
**File:** `backend/src/common/utils/hash-password.ts`

```typescript
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  if (!hash || typeof hash !== 'string' || hash.length !== 60) {
    return false;
  }
  return bcrypt.compare(hash, password);
}
```

**Actions:**
- Upgrade salt rounds from 10 to 12
- Add null/invalid hash validation to prevent timing attacks
- Create migration script for existing password hashes

---

## Phase 2: Token Strategy Overhaul

### 2.1 Token Configuration
| Token | Storage | Lifetime | HttpOnly | Secure | SameSite |
|-------|---------|----------|----------|--------|----------|
| Access | Memory/Client | 15m | No* | Yes | Strict |
| Refresh | Database | 7d | Yes | Yes | Strict |
| CSRF | Cookie | 24h | No | Yes | Strict |

*Access token sent via `Authorization: Bearer` header only, never stored

### 2.2 Refresh Token Schema
**File:** `backend/src/database/schema/sessions.ts`

```typescript
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  refreshTokenVersion: integer('refresh_token_version').notNull().default(1),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  revoked: boolean('revoked').default(false),
  revokedAt: timestamp('revoked_at'),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
});
```

**Actions:**
- Store only SHA-256 hash of refresh token, never plaintext
- Add `refreshTokenVersion` for rotation tracking
- Track `userAgent` and `ipAddress` for anomaly detection
- Add `revokedAt` timestamp

### 2.3 Token Service
**File:** `backend/src/modules/auth/token.service.ts`

```typescript
@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  generateAccessToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        organisationId: user.organisationId,
        type: 'access',
        jti: crypto.randomUUID(),
      },
      {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      },
    );
  }

  async generateRefreshToken(userId: string, context: RequestContext): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await this.sessionsService.create({
      userId,
      refreshTokenHash: tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent: context.headers['user-agent'],
      ipAddress: context.ip,
    });

    return token;
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new TokenExpiredException();
      }
      throw new InvalidTokenException();
    }
  }

  async verifyRefreshToken(token: string): Promise<Session> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await this.sessionsService.findByTokenHash(tokenHash);

    if (!session || session.revoked || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return session;
  }

  async rotateRefreshToken(session: Session, context: RequestContext): Promise<string> {
    await this.sessionsService.revoke(session.id);
    return this.generateRefreshToken(session.userId, context);
  }
}
```

**Actions:**
- Use crypto.randomBytes(64) for refresh tokens (256 bits entropy)
- Hash tokens with SHA-256 before database storage
- Implement token rotation on every refresh
- Add `jti` (JWT ID) for access token revocation capability

---

## Phase 3: Strict Input Validation

### 3.1 Password Policy
**File:** `backend/src/common/validators/password.validator.ts`

```typescript
export const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  maxRepeatedChars: 3,
  maxSequentialChars: 4,
};

export function validatePassword(password: string): string[] {
  const errors: string[] = [];

  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  if (/(.)\1{3,}/.test(password)) {
    errors.push('Password must not contain more than 3 repeated characters');
  }
  if (/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789)/i.test(password)) {
    errors.push('Password must not contain sequential characters (abc, 123, etc.)');
  }

  return errors;
}
```

### 3.2 Updated DTOs
**File:** `backend/src/modules/auth/dto/auth.dto.ts`

```typescript
export class RegisterDto {
  @ApiProperty({ example: 'admin@test.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd!' })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Validate(PasswordComplexity)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'My Company' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  organisationName: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@test.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'SecureP@ssw0rd!' })
  @IsString()
  password: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@test.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Validate(PasswordComplexity)
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Validate(PasswordComplexity)
  newPassword: string;
}
```

**Actions:**
- Enforce password complexity (12+ chars, uppercase, lowercase, number, special)
- Add `Transform` to normalize email to lowercase/trim
- Add `@MaxLength` to prevent DoS via oversized inputs
- Create custom `PasswordComplexity` validator

---

## Phase 4: Session Management

### 4.1 Session Service
**File:** `backend/src/modules/auth/sessions.service.ts`

```typescript
@Injectable()
export class SessionsService {
  constructor(@Inject(DB) private db: DbType) {}

  async create(data: CreateSessionDto): Promise<Session> {
    const [session] = await this.db.insert(sessions).values(data).returning();
    return session;
  }

  async findByTokenHash(tokenHash: string): Promise<Session | null> {
    const [session] = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.refreshTokenHash, tokenHash), isNull(sessions.revokedAt)));
    return session;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  async revoke(sessionId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(eq(sessions.id, sessionId));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
    await this.db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          ne(sessions.id, currentSessionId),
          isNull(sessions.revokedAt),
        ),
      );
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await this.db
      .delete(sessions)
      .where(or(eq(sessions.revoked, true), lt(sessions.expiresAt, new Date())));
    return result.rowCount;
  }
}
```

### 4.2 Cron Cleanup Job
**File:** `backend/src/modules/auth/session-cleanup.job.ts`

```typescript
@Injectable()
export class SessionCleanupJob implements OnModuleInit {
  constructor(private sessionsService: SessionsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    const deleted = await this.sessionsService.cleanupExpiredSessions();
    if (deleted > 0) {
      console.log(`[SessionCleanup] Removed ${deleted} expired sessions`);
    }
  }
}
```

**Actions:**
- Add `revokeAllUserSessions` for "logout everywhere"
- Add `revokeAllOtherSessions` for "logout other devices"
- Add hourly cron job to clean expired/revoked sessions
- Track IP and User-Agent for security auditing

---

## Phase 5: Authentication Flows

### 5.1 Login Flow
**File:** `backend/src/modules/auth/auth.service.ts`

```typescript
async login(
  loginDto: LoginDto,
  context: RequestContext,
): Promise<AuthResponseDto> {
  const user = await this.usersService.findByEmail(loginDto.email);

  if (!user) {
    await this.passwordFailDelay();
    throw new UnauthorizedException('Invalid credentials');
  }

  if (!user.passwordHash) {
    throw new UnauthorizedException(
      'This account uses OAuth. Please sign in with Google.',
    );
  }

  if (!user.isActive) {
    throw new UnauthorizedException('Account is deactivated');
  }

  const isPasswordValid = await verifyPassword(
    loginDto.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    await this.passwordFailDelay();
    await this.usersService.recordFailedLogin(user.id);
    throw new UnauthorizedException('Invalid credentials');
  }

  if (!user.emailVerified) {
    await this.emailService.sendVerificationEmail(user.id, user.email);
    throw new UnauthorizedException(
      'Please verify your email before signing in. A new verification link has been sent.',
    );
  }

  await this.usersService.recordSuccessfulLogin(user.id);

  const accessToken = this.tokenService.generateAccessToken(user);
  const refreshToken = await this.tokenService.generateRefreshToken(user.id, context);

  await this.sessionsService.create({
    userId: user.id,
    refreshTokenHash: crypto.createHash('sha256').update(refreshToken).digest('hex'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: context.headers['user-agent'],
    ipAddress: context.ip,
  });

  return {
    accessToken,
    refreshToken,
    user: this.sanitizeUser(user),
  };
}

async refreshToken(
  refreshToken: string,
  context: RequestContext,
): Promise<AuthResponseDto> {
  const session = await this.tokenService.verifyRefreshToken(refreshToken);
  const user = await this.usersService.findById(session.userId);

  if (!user || !user.isActive) {
    throw new UnauthorizedException('User not found or inactive');
  }

  const newRefreshToken = await this.tokenService.rotateRefreshToken(session, context);
  const accessToken = this.tokenService.generateAccessToken(user);

  return {
    accessToken,
    refreshToken: newRefreshToken,
    user: this.sanitizeUser(user),
  };
}
```

### 5.2 Rate Limiting
**File:** `backend/src/modules/auth/auth.controller.ts`

```typescript
@Controller('auth')
@UseGuards(ThrottlerGuard)
@ApiTags('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @Throttle(5, 60) // 5 attempts per minute
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    return this.authService.login(loginDto, req as RequestContext);
  }

  @Post('register')
  @Throttle(3, 60) // 3 attempts per minute
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    return this.authService.register(registerDto, req as RequestContext);
  }

  @Post('refresh')
  @Throttle(10, 60) // 10 attempts per minute
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id);
  }
}
```

**Actions:**
- Add constant-time delay for failed passwords to prevent timing attacks
- Track failed login attempts and lock after threshold
- Enforce email verification BEFORE login for new users
- Add per-endpoint rate limiting (not just global)
- Send new verification email if user not verified

### 5.3 Verification Flow
**File:** `backend/src/modules/auth/verifications.service.ts`

```typescript
@Injectable()
export class VerificationService {
  constructor(
    private usersService: UsersService,
    private emailService: EmailService,
  ) {}

  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.verificationTokensService.create({
      userId,
      tokenHash,
      type: 'email_verification',
      expiresAt,
    });

    await this.emailService.sendVerificationEmail(email, token);
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const verification = await this.verificationTokensService.findValid(tokenHash);

    if (!verification) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (verification.usedAt) {
      throw new BadRequestException('Verification token has already been used');
    }

    await this.verificationTokensService.markUsed(verification.id);
    await this.usersService.markEmailVerified(verification.userId);
  }

  async sendPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return; // Silent fail - don't reveal if email exists
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.verificationTokensService.create({
      userId: user.id,
      tokenHash,
      type: 'password_reset',
      expiresAt,
    });

    await this.emailService.sendPasswordResetEmail(user.email, token);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const verification = await this.verificationTokensService.findValidByType(
      tokenHash,
      'password_reset',
    );

    if (!verification) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      throw new BadRequestException(errors.join('. '));
    }

    const passwordHash = await hashPassword(newPassword);
    await this.usersService.updatePassword(verification.userId, passwordHash);
    await this.verificationTokensService.markUsed(verification.id);
    await this.sessionsService.revokeAllUserSessions(verification.userId);
  }
}
```

**Actions:**
- Use crypto.randomBytes for all verification tokens
- Hash tokens before database storage
- Check `usedAt` before allowing reuse (prevent race conditions)
- Silent fail on password reset if email doesn't exist (no enumeration)
- Invalidate all sessions on password reset

---

## Phase 6: Guards & Authorization

### 6.1 Strict JWT Guard
**File:** `backend/src/common/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        organisationId: payload.organisationId,
      };

      return true;
    } catch (error) {
      if (error instanceof TokenExpiredException) {
        throw new UnauthorizedException('Token has expired');
      }
      if (error instanceof InvalidTokenException) {
        throw new UnauthorizedException('Invalid token');
      }
      throw error;
    }
  }

  private extractTokenFromHeader(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
```

### 6.2 Roles Guard (Strict)
**File:** `backend/src/common/guards/roles.guard.ts`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, access is DENIED by default
    // This prevents accidental exposure due to missing decorators
    if (!requiredRoles || requiredRoles.length === 0) {
      console.warn(
        `SECURITY WARNING: ${context.getClass().name}::${context.getHandler().name} has no role requirements. Access denied by default.`,
      );
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### 6.3 Tenant Guard (Strict)
**File:** `backend/src/common/guards/tenant.guard.ts`

```typescript
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const requestedTenantId = request.params.tenantId || request.body?.tenantId;

    if (!requestedTenantId) {
      return true; // No tenant context requested
    }

    // Verify user belongs to the requested tenant
    const userWithTenant = await this.usersService.findById(user.id);

    if (!userWithTenant || userWithTenant.organisationId !== requestedTenantId) {
      throw new ForbiddenException('Access to this tenant is forbidden');
    }

    return true;
  }
}
```

**Actions:**
- JWT Guard: Validate token type is 'access', not just 'refresh'
- Roles Guard: DENY access by default if no roles specified (fail-safe)
- Tenant Guard: Verify user actually belongs to requested tenant

---

## Phase 7: OAuth / Social Login

### 7.1 Google Strategy (Strict)
**File:** `backend/src/modules/auth/strategies/google.strategy.ts`

```typescript
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: '/api/auth/google/callback',
      scope: ['email', 'profile'],
      prompt: 'select_account',
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { emails, displayName, id } = profile;

    if (!emails || !emails.length) {
      throw new BadRequestException('Google account must have an email address');
    }

    const email = emails[0].value.toLowerCase();

    let user = await this.usersService.findByGoogleId(id);

    if (!user) {
      user = await this.usersService.findByEmail(email);

      if (user) {
        // Link Google account to existing email/password account
        if (user.passwordHash) {
          await this.usersService.update(user.id, { googleId: id });
        } else {
          throw new BadRequestException(
            'An account with this email already exists. Please sign in with your password.',
          );
        }
      } else {
        // Create new user - require email verification
        const organisation = await this.organisationsService.create({
          name: `${displayName}'s Organization`,
          slug: slugify(`${displayName}-org-${Date.now()}`),
        });

        user = await this.usersService.create({
          email,
          googleId: id,
          name: displayName,
          role: Role.CUSTOMER,
          organisationId: organisation.id,
          emailVerified: emails[0].verified || false,
        });

        if (!user.emailVerified) {
          await this.verificationService.sendEmailVerification(user.id, email);
        }
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Always check email verification for OAuth too
    if (!user.emailVerified) {
      await this.verificationService.sendEmailVerification(user.id, user.email);
      throw new UnauthorizedException(
        'Please verify your Google account email before signing in.',
      );
    }

    return user;
  }
}
```

**Actions:**
- Require email verification even for Google users
- Don't auto-create unverified users
- Send verification email if Google says email is unverified
- Block login until email is verified

---

## Phase 8: Webhook & API Key Security

### 8.1 Timing-Safe Comparison
**File:** `backend/src/common/utils/timing-safe-compare.ts`

```typescript
import * as crypto from 'crypto';

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  return crypto.timingMemoryEqual(bufA, bufB);
}

export function hashForStorage(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}
```

### 8.2 Webhook Guard
**File:** `backend/src/common/guards/api-key.guard.ts`

```typescript
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-api-key'] || request.headers['authorization']?.replace('ApiKey ', '');

    if (!token) {
      throw new UnauthorizedException('API key is required');
    }

    const expectedKey = this.configService.get('TRACK17_API_KEY');

    if (!expectedKey) {
      console.error('FATAL: TRACK17_API_KEY is not configured');
      throw new InternalServerErrorException('Webhook is not configured');
    }

    if (!timingSafeEqual(token, expectedKey)) {
      throw new UnauthorizedException('Invalid API key');
    }

    return true;
  }
}
```

**Actions:**
- Use `crypto.timingMemoryEqual` for timing-safe comparison
- Prefer `Authorization` header over URL query params
- Log all webhook access for auditing
- Never log the actual API key value

---

## Phase 9: Request Context

### 9.1 Request Context Interface
**File:** `backend/src/common/interfaces/request-context.interface.ts`

```typescript
export interface RequestContext {
  ip: string;
  headers: {
    'user-agent'?: string;
    'x-forwarded-for'?: string;
    'x-real-ip'?: string;
  };
  userAgent: string;
  ipAddress: string;
}

export function extractRequestContext(request: any): RequestContext {
  const ip =
    request.headers['x-forwarded-for']?.split(',')[0] ||
    request.headers['x-real-ip'] ||
    request.socket?.remoteAddress ||
    'unknown';

  return {
    ip,
    headers: {
      'user-agent': request.headers['user-agent'],
      'x-forwarded-for': request.headers['x-forwarded-for'],
      'x-real-ip': request.headers['x-real-ip'],
    },
    userAgent: request.headers['user-agent'] || 'unknown',
    ipAddress: ip,
  };
}
```

---

## Phase 10: Module Structure

### 10.1 New Auth Module Structure
```
backend/src/modules/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── token.service.ts
├── sessions.service.ts
├── verification.service.ts
├── email.service.ts
├── environment.validator.ts
├── dto/
│   ├── login.dto.ts
│   ├── register.dto.ts
│   ├── refresh-token.dto.ts
│   ├── forgot-password.dto.ts
│   ├── reset-password.dto.ts
│   ├── change-password.dto.ts
│   └── index.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── local.strategy.ts
│   ├── google.strategy.ts
│   └── index.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   ├── tenant.guard.ts
│   ├── api-key.guard.ts
│   ├── guest.guard.ts
│   └── index.ts
├── decorators/
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   ├── roles.decorator.ts
│   └── tenant.decorator.ts
├── interfaces/
│   ├── jwt-payload.interface.ts
│   ├── authenticated-user.interface.ts
│   └── index.ts
├── validators/
│   ├── password.validator.ts
│   └── index.ts
└── jobs/
    ├── session-cleanup.job.ts
    └── index.ts
```

---

## Phase 11: New Auth Module Code

### 11.1 Auth Module
**File:** `backend/src/modules/auth/auth.module.ts`

```typescript
@Module({
  imports: [
    UsersModule,
    OrganisationsModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    EnvironmentValidator,
    AuthService,
    TokenService,
    SessionsService,
    VerificationService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    ApiKeyGuard,
    SessionCleanupJob,
  ],
  exports: [
    AuthService,
    TokenService,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
  ],
})
export class AuthModule {}
```

---

## Phase 12: Frontend Changes

### 12.1 Token Storage (Secure)
**File:** `admin/lib/api.ts`

```typescript
class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;

    // Store refresh token in httpOnly cookie (server sets)
    document.cookie = `refreshToken=${refresh}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    document.cookie = 'refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Important: send cookies
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        window.location.href = '/login';
        return false;
      }

      const tokens = await response.json();
      await this.setTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      this.clearTokens();
      window.location.href = '/login';
      return false;
    }
  }

  async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    let token = this.getAccessToken();
    let attempts = 0;

    while (attempts < 2) {
      const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      let response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        return response.json();
      }

      if (response.status === 401 && attempts === 0) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          token = this.getAccessToken();
          attempts++;
          continue;
        }
      }

      throw new ApiError(response.status, await response.text());
    }

    throw new ApiError(401, 'Unauthorized');
  }
}
```

**Actions:**
- Access token: Memory only (never localStorage/sessionStorage)
- Refresh token: HttpOnly cookie (managed by server)
- Auto-refresh on 401 with proper error handling

---

## Phase 13: Migration Strategy

### 13.1 Database Migrations
```sql
-- Add refresh_token_version to sessions
ALTER TABLE sessions ADD COLUMN refresh_token_version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE sessions ADD COLUMN refresh_token_hash TEXT NOT NULL;
ALTER TABLE sessions ADD COLUMN revoked_at TIMESTAMP;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN ip_address TEXT;

-- Create index for token lookup
CREATE INDEX idx_sessions_token_hash ON sessions(refresh_token_hash) WHERE revoked_at IS NULL;

-- Drop old plaintext refresh_token column
ALTER TABLE sessions DROP COLUMN refresh_token;

-- Add is_active column to users if not exists
ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true NOT NULL;

-- Add failed_login_attempts and locked_until to users
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
```

### 13.2 Migration Order
1. Deploy new environment validation (verify all secrets)
2. Run database migrations
3. Deploy new token service and session service
4. Deploy new guards (with fail-safe defaults)
5. Deploy new auth service (with strict validation)
6. Deploy new frontend (token handling)
7. Enable new password policy

---

## Phase 14: Testing Strategy

### 14.1 Unit Tests Required
```typescript
describe('PasswordValidator', () => {
  it('should reject passwords shorter than 12 characters');
  it('should reject passwords without uppercase');
  it('should reject passwords without numbers');
  it('should reject passwords with 4+ repeated characters');
  it('should reject passwords with sequential characters');
  it('should accept valid passwords');
});

describe('TokenService', () => {
  it('should generate access tokens with jti claim');
  it('should hash refresh tokens before storage');
  it('should reject expired refresh tokens');
  it('should reject revoked refresh tokens');
  it('should rotate tokens on refresh');
});

describe('JwtAuthGuard', () => {
  it('should reject requests without token');
  it('should reject requests with expired token');
  it('should reject requests with refresh token in access endpoint');
  it('should allow requests with valid access token');
});

describe('RolesGuard', () => {
  it('should deny access when no roles specified (fail-safe)');
  it('should allow access when user has required role');
  it('should deny access when user lacks required role');
});
```

### 14.2 Integration Tests
- Login flow with valid/invalid credentials
- Token refresh with valid/expired/revoked tokens
- Password reset with valid/expired/malformed tokens
- Rate limiting enforcement
- Email verification flow
- OAuth flow with verified/unverified emails

---

## Implementation Phases

| Phase | Priority | Task | Risk |
|-------|----------|------|------|
| 1 | CRITICAL | Environment Validator (fail-fast on missing secrets) | Low |
| 2 | CRITICAL | Database migrations | Medium |
| 3 | CRITICAL | New token service with hashing | Low |
| 4 | HIGH | Strict password validation | Low |
| 5 | HIGH | New session service with rotation | Medium |
| 6 | HIGH | Updated guards (fail-safe defaults) | Medium |
| 7 | HIGH | Rate limiting on auth endpoints | Low |
| 8 | MEDIUM | Verification service improvements | Low |
| 9 | MEDIUM | Frontend token handling | Medium |
| 10 | LOW | Session cleanup cron job | Low |
| 11 | LOW | OAuth email verification enforcement | Medium |

---

## Security Checklist

- [ ] No hardcoded secrets anywhere
- [ ] No fallback JWT secrets
- [ ] BCRYPT_ROUNDS >= 12
- [ ] All tokens hashed with SHA-256
- [ ] Refresh token rotation on every use
- [ ] Timing-safe comparison for all secrets
- [ ] Password complexity: 12+ chars, upper, lower, number, special
- [ ] Email verification required before login
- [ ] Roles guard denies by default
- [ ] Tenant guard verifies ownership
- [ ] Rate limiting on all auth endpoints
- [ ] Access token in memory only (not localStorage)
- [ ] Refresh token in HttpOnly cookie
- [ ] Session cleanup job running hourly
- [ ] No token enumeration (silent fails where appropriate)
- [ ] Failed login tracking and account lockout

---

# Other Modules Security Audit

## Executive Summary

Beyond the auth module, multiple modules have CRITICAL and HIGH severity vulnerabilities that require immediate attention:

| Module | Critical | High | Medium | Low |
|--------|----------|------|--------|-----|
| Users | 4 | 6 | 4 | - |
| Shipments | 7 | 6 | 3 | - |
| Quotes | 3 | 4 | 3 | - |
| Notifications | 3 | 4 | 3 | - |
| Events (WebSocket) | 4 | 2 | - | - |
| Email | - | 3 | 2 | - |
| Organisations | - | 2 | 2 | - |

---

## CRITICAL Issues (All Modules)

### 1. USERS MODULE

#### Issue 1.1: Sensitive Data Exposure
**File:** `backend/src/modules/users/services.ts:40-41`

```typescript
async findById(id: string) {
  const user = await db.select().from(users).where(eq(users.id, id));
  return user[0]; // Returns passwordHash, googleId
}
```

**Problem:** `findById` returns entire user object including `passwordHash` and `googleId`. This data leaks in endpoints like `/users/me`, `/users/:id`.

**Fix:** Create sanitized user response DTO:

```typescript
// dto/sanitized-user.dto.ts
export class SanitizedUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ nullable: true })
  organisationId: string | null;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  isActive: boolean;

  // Explicitly exclude: passwordHash, googleId, phoneNumber
}
```

#### Issue 1.2: IDOR - Staff Can Access Any User
**File:** `backend/src/modules/users/users.controller.ts:182-185`

**Problem:** Staff role bypasses organization check - can view ANY user by ID regardless of organization.

**Fix:** Add ownership verification:

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF)
async findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
  const targetUser = await this.usersService.findById(id);

  // Staff can only access users in their organization
  if (user.role === Role.STAFF && targetUser.organisationId !== user.organisationId) {
    throw new ForbiddenException('Access denied');
  }

  return this.usersService.sanitizeUser(targetUser);
}
```

#### Issue 1.3: Role Assignment via invite()
**File:** `backend/src/modules/users/users.controller.ts:143`

**Problem:** `inviteDto.role` can be passed by non-admin to assign higher privileges.

**Fix:** Remove role from invite DTO or enforce admin-only:

```typescript
// InviteDto - NO role field
export class InviteDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;
}

// Controller enforces admin-only role assignment
@Post('invite')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
async invite(@Body() inviteDto: InviteDto, @CurrentUser() user: AuthenticatedUser) {
  // Role is assigned by system, not by requester
  const role = Role.STAFF; // Default role
  // ...
}
```

---

### 2. SHIPMENTS MODULE

#### Issue 2.1: Missing Auth on Public Endpoint
**File:** `backend/src/modules/shipments/shipments.controller.ts:141-152`

```typescript
@Get('public/track/:code')
async trackPublic(@Param('code') code: string) {
  // Returns full shipment details including recipient email, phone, address
  return this.shipmentsService.findByTrackingCode(code);
}
```

**Problem:** Public tracking endpoint returns full shipment details including recipient PII (email, phone, address).

**Fix:** Create limited public DTO:

```typescript
export class PublicTrackingDto {
  @ApiProperty()
  trackingCode: string;

  @ApiProperty()
  status: ShipmentStatus;

  @ApiProperty()
  carrier: string;

  @ApiProperty()
  estimatedDelivery: Date | null;

  @ApiProperty()
  lastUpdate: Date;

  // NO recipient email, phone, address
  @ApiPropertyOptional()
  recipientName: string; // First name only

  @ApiPropertyOptional()
  events: TrackingEventDto[]; // Public events only
}
```

#### Issue 2.2: Multiple IDOR Vulnerabilities
**Files:** `shipments.controller.ts:154-256`

**Problem:** No organization/tenant verification on any shipment operation.

**Fix:** Add tenant guard to all endpoints:

```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
@Roles(Role.ADMIN, Role.STAFF, Role.CUSTOMER)
async findAll(
  @CurrentUser() user: AuthenticatedUser,
  @Query('organisationId') orgId?: string,
) {
  // TenantGuard verifies user has access to organisationId
  return this.shipmentsService.findAll({
    organisationId: orgId || user.organisationId,
    userId: user.role === Role.CUSTOMER ? user.id : undefined,
  });
}
```

#### Issue 2.3: Webhook No Auth
**File:** `track17.webhook.controller.ts:46-51`

```typescript
@Post('webhook')
async handleWebhook(
  @Headers('17token') token: string,
  @Body() data: any,
) {
  if (expectedToken && token !== expectedToken) {
    throw new UnauthorizedException();
  }
  // No cryptographic signature verification
}
```

**Problem:** Only checks token equality, not cryptographic signature. No timing-safe comparison.

**Fix:** Implement HMAC signature verification:

```typescript
@Injectable()
export class WebhookSecurityService {
  verifyTrack17Signature(payload: string, signature: string): boolean {
    const secret = this.configService.get('TRACK17_WEBHOOK_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('Webhook not configured');
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return timingSafeEqual(signature, `sha256=${expected}`);
  }
}

@Post('webhook')
async handleWebhook(
  @Headers('x-signature') signature: string,
  @Body() data: any,
  @Req() req: Request,
) {
  const rawBody = req.body; // Need raw body for signature verification
  if (!this.webhookSecurity.verifyTrack17Signature(rawBody, signature)) {
    throw new UnauthorizedException('Invalid signature');
  }
  // ...
}
```

---

### 3. NOTIFICATIONS MODULE

#### Issue 3.1: Notification Hijacking
**File:** `notifications.controller.ts:36-40`

```typescript
@Post()
async create(@Body() createNotificationDto: CreateNotificationDto) {
  // createNotificationDto.userId can be any user in same org
}
```

**Problem:** Any user can create notification for ANY other user in same org via `dto.userId`.

**Fix:** Remove userId from DTO, use current user:

```typescript
export class CreateNotificationDto {
  @ApiProperty()
  @IsString()
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  // NO userId - always use current user
}

@Post()
@UseGuards(JwtAuthGuard)
async create(@Body() dto: CreateNotificationDto, @CurrentUser() user: AuthenticatedUser) {
  return this.notificationsService.create({
    ...dto,
    userId: user.id, // Force current user
    organisationId: user.organisationId,
  });
}
```

#### Issue 3.2: Email Injection
**File:** `notification-processor.ts:73`

```typescript
await this.emailService.sendEmail({
  to: data.email, // No validation
  subject: data.subject,
  html: data.html,
});
```

**Fix:** Validate email format:

```typescript
@IsEmail({}, { message: 'Invalid email address' })
email: string;
```

---

### 4. EVENTS MODULE (WebSocket)

#### Issue 4.1: Hardcoded JWT Secret
**File:** `events.module.ts:13-14`

```typescript
jwtModule: JwtModule.register({
  secret: process.env.JWT_SECRET || 'your-super-secret-key-min-32-chars',
})
```

**CRITICAL:** This is catastrophic if used in production.

**Fix:** Fail on missing secret:

```typescript
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('FATAL: JWT_SECRET is required for WebSocket authentication');
}

jwtModule: JwtModule.register({
  secret: jwtSecret,
})
```

#### Issue 4.2: Weak WebSocket Auth
**File:** `events.gateway.ts:25-36`

```typescript
async handleConnection(client: Socket) {
  try {
    const token = client.handshake.auth?.token || client.handshake.headers?.authorization;
    if (token) {
      const user = await this.verifyToken(token);
      // Auth failure silently ignored - client connects anyway
    }
  } catch (e) {
    // Silently allows connection without auth
  }
}
```

**Fix:** Reject unauthenticated connections:

```typescript
async handleConnection(client: Socket) {
  const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    client.emit('error', { message: 'Authentication required' });
    client.disconnect(true);
    return;
  }

  try {
    const user = await this.verifyToken(token);
    const existingUser = await this.usersService.findById(user.sub);

    if (!existingUser || !existingUser.isActive) {
      client.emit('error', { message: 'User not found or inactive' });
      client.disconnect(true);
      return;
    }

    client.data.user = existingUser;
  } catch (e) {
    client.emit('error', { message: 'Invalid token' });
    client.disconnect(true);
  }
}
```

#### Issue 4.3: CORS Allow-All
**File:** `events.gateway.ts:14-16`

```typescript
@WebSocketGateway({
  cors: { origin: '*' }, // Allows any origin
})
```

**Fix:** Restrict to known origins:

```typescript
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];

@WebSocketGateway({
  cors: {
    origin: corsOrigins,
    credentials: true,
  },
})
```

---

### 5. QUOTES MODULE

#### Issue 5.1: Customer Can Delete Other Customer Quotes
**File:** `quotes.controller.ts:161-162`

**Problem:** `delete()` at line 166 doesn't verify quote ownership - customers in same org can delete each other's quotes.

**Fix:** Verify ownership before delete:

```typescript
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.STAFF, Role.CUSTOMER)
async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
  const quote = await this.quotesService.findById(id);

  if (!quote) {
    throw new NotFoundException('Quote not found');
  }

  // Customers can only delete their own quotes
  if (user.role === Role.CUSTOMER && quote.userId !== user.id) {
    throw new ForbiddenException('Cannot delete another customer\'s quote');
  }

  // Staff/Admin can delete any quote in their org
  if (user.role !== Role.CUSTOMER && quote.organisationId !== user.organisationId) {
    throw new ForbiddenException('Access denied');
  }

  return this.quotesService.delete(id);
}
```

#### Issue 5.2: Price Exposure
**File:** `quotes.service.ts:142-147`

**Problem:** Customer's `findByUser` returns quotes including `price` field set by staff.

**Fix:** Create filtered response DTO:

```typescript
export class CustomerQuoteDto {
  // Include only fields customer should see
  id: string;
  origin: string;
  destination: string;
  weight: number;
  dimensions: string;
  status: QuoteStatus;
  createdAt: Date;
  // NO price field for customers
}

export class StaffQuoteDto extends CustomerQuoteDto {
  price: number; // Only staff see price
}
```

---

## HIGH Priority Fixes

### 1. Add Missing Guards

| Endpoint | Missing Guard |
|----------|---------------|
| `GET /shipments/public/track/:code` | RateLimitGuard, PublicGuard |
| `POST /notifications` | JwtAuthGuard |
| `GET /users/stats` | RolesGuard |
| `WS /events` | Proper JWT verification |

### 2. Input Validation on All Endpoints

```typescript
// Create proper DTOs with validation
export class CreateShipmentDto {
  @IsString()
  @MinLength(2)
  recipientName: string;

  @IsEmail()
  recipientEmail: string;

  @IsPhoneNumber()
  recipientPhone: string;

  @IsString()
  recipientAddress: string;

  @IsEnum(Carrier)
  carrier: Carrier;

  @IsNumber()
  @Min(0.01)
  weight: number;
}
```

### 3.organisationId Parameter Handling

All modules accept `organisationId` as query/body param allowing cross-tenant access:

```typescript
// BEFORE (VULNERABLE)
@Get()
async findAll(@Query('organisationId') orgId?: string) {
  return this.shipmentsService.findAll({ organisationId: orgId });
}

// AFTER (SECURE)
@Get()
@UseGuards(JwtAuthGuard, TenantGuard)
async findAll(@CurrentUser() user: AuthenticatedUser) {
  // TenantGuard ensures user can only access their org
  return this.shipmentsService.findAll({ organisationId: user.organisationId });
}
```

---

## Architecture Improvements

### 1. Authorization Service

Create centralized authorization:

```typescript
@Injectable()
export class AuthorizationService {
  constructor(private usersService: UsersService) {}

  async canAccessResource(user: AuthenticatedUser, resourceOrgId: string): Promise<boolean> {
    if (user.role === Role.ADMIN) return true;
    return user.organisationId === resourceOrgId;
  }

  async canAccessUser(user: AuthenticatedUser, targetUserId: string): Promise<boolean> {
    if (user.role === Role.ADMIN) return true;

    const target = await this.usersService.findById(targetUserId);
    return target?.organisationId === user.organisationId;
  }
}
```

### 2. Base Controller with Authorization

```typescript
export abstract class BaseController {
  protected abstract resourceOrgIdField: string;

  async checkAccess(user: AuthenticatedUser, resource: any): Promise<void> {
    if (user.role === Role.ADMIN) return;

    const resourceOrgId = resource[this.resourceOrgIdField];
    if (resourceOrgId !== user.organisationId) {
      throw new ForbiddenException('Access denied');
    }
  }
}
```

### 3. Database Transactions

For multi-step operations:

```typescript
async createShipmentWithNotification(data: CreateShipmentDto, user: AuthenticatedUser) {
  return this.db.transaction(async (tx) => {
    const shipment = await tx.insert(shipments).values({
      ...data,
      organisationId: user.organisationId,
    }).returning();

    await tx.insert(notifications).values({
      userId: user.id,
      organisationId: user.organisationId,
      type: NotificationType.SHIPMENT_CREATED,
    });

    return shipment;
  });
}
```

### 4. Composite Database Indexes

```sql
-- Notifications
CREATE INDEX idx_notifications_org_user ON notifications(organisation_id, user_id);

-- Shipments
CREATE INDEX idx_shipments_org_status ON shipments(organisation_id, status);
CREATE INDEX idx_shipments_tracking_code ON shipments(tracking_code);

-- Quotes
CREATE INDEX idx_quotes_org_user ON quotes(organisation_id, user_id);
```

---

## Complete Implementation Phases

| Phase | Module | Priority | Task |
|-------|--------|----------|------|
| 1 | Auth | CRITICAL | Environment validation (fail-fast) |
| 2 | Auth | CRITICAL | Token service with hashing |
| 3 | Users | CRITICAL | Sanitize user responses, fix IDOR |
| 4 | Shipments | CRITICAL | Fix public endpoint, add tenant guard |
| 5 | Events | CRITICAL | Remove hardcoded secret, fix WebSocket auth |
| 6 | Notifications | CRITICAL | Fix notification hijacking |
| 7 | All | HIGH | Add missing guards to all endpoints |
| 8 | All | HIGH | Add DTO validation everywhere |
| 9 | Quotes | HIGH | Fix price exposure, ownership checks |
| 10 | Database | MEDIUM | Add composite indexes |
| 11 | All | MEDIUM | Add audit logging |
| 12 | All | MEDIUM | Database transactions for multi-step ops |

---

## Security Checklist (All Modules)

### Auth Module
- [ ] No hardcoded secrets anywhere
- [ ] No fallback JWT secrets
- [ ] BCRYPT_ROUNDS >= 12
- [ ] All tokens hashed with SHA-256
- [ ] Refresh token rotation on every use
- [ ] Timing-safe comparison for all secrets
- [ ] Password complexity: 12+ chars
- [ ] Email verification required before login
- [ ] Roles guard denies by default
- [ ] Tenant guard verifies ownership
- [ ] Rate limiting on all auth endpoints
- [ ] Failed login tracking and account lockout

### Users Module
- [ ] User responses NEVER include passwordHash
- [ ] Staff can only access users in their organisation
- [ ] Invite endpoint does NOT allow role assignment by requester
- [ ] All user endpoints have proper authorization

### Shipments Module
- [ ] Public tracking endpoint returns LIMITED data only
- [ ] All shipment endpoints verify tenant ownership
- [ ] Webhook has cryptographic signature verification
- [ ] No organisationId parameter bypass

### Notifications Module
- [ ] Users can ONLY create notifications for themselves
- [ ] Email addresses validated before sending
- [ ] No userId field accepted in create DTO

### Events Module
- [ ] NO hardcoded JWT secret fallback
- [ ] Unauthenticated WebSocket connections REJECTED
- [ ] CORS restricted to known origins only
- [ ] User existence verified on connection

### Quotes Module
- [ ] Customers can only delete their OWN quotes
- [ ] Price field NOT exposed to customers
- [ ] All quote endpoints verify organisation ownership

### Organizations Module
- [ ] Users can only access their OWN organisation
- [ ] No organisationId parameter bypass

### General
- [ ] All endpoints have appropriate guards
- [ ] All inputs validated with class-validator
- [ ] No sensitive data in logs
- [ ] Database transactions for multi-step operations
- [ ] Composite indexes on frequent query patterns
