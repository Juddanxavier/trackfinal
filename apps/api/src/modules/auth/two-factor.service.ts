import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { db } from '../../database';
import { userTwoFactor } from '../../database/schema/user';
import { eq, and } from 'drizzle-orm';
import { EmailService } from './email.service';
import * as crypto from 'crypto';

@Injectable()
export class TwoFactorService {
  private readonly logger = new Logger(TwoFactorService.name);
  private readonly CODE_LENGTH = 6;
  private readonly CODE_EXPIRY_MINUTES = 5;

  constructor(private emailService: EmailService) {}

  async getStatus(
    userId: string,
  ): Promise<{ enabled: boolean; verified: boolean }> {
    const [row] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId));
    return {
      enabled: row?.enabled ?? false,
      verified: row?.verified ?? false,
    };
  }

  async setup(userId: string, email: string): Promise<{ message: string }> {
    const code = this.generateCode();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(
      Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000,
    );

    const [existing] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId));

    if (existing) {
      await db
        .update(userTwoFactor)
        .set({
          pendingCodeHash: codeHash,
          pendingCodeExpiresAt: expiresAt,
          verified: false,
          enabled: false,
          updatedAt: new Date(),
        })
        .where(eq(userTwoFactor.userId, userId));
    } else {
      await db.insert(userTwoFactor).values({
        userId,
        pendingCodeHash: codeHash,
        pendingCodeExpiresAt: expiresAt,
      });
    }

    await this.emailService.sendTwoFactorCode(email, code);
    this.logger.log(`2FA setup code sent to ${email}`);

    return { message: 'Verification code sent to your email' };
  }

  async verify(
    userId: string,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    const [row] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId));

    if (!row || !row.pendingCodeHash || !row.pendingCodeExpiresAt) {
      throw new BadRequestException(
        'No verification code pending. Start setup again.',
      );
    }

    if (new Date() > row.pendingCodeExpiresAt) {
      throw new BadRequestException(
        'Verification code expired. Start setup again.',
      );
    }

    const inputHash = crypto.createHash('sha256').update(code).digest('hex');
    if (inputHash !== row.pendingCodeHash) {
      throw new BadRequestException('Invalid verification code');
    }

    const backupCodes = this.generateBackupCodes();
    const hashedCodes = backupCodes.map((c) =>
      crypto.createHash('sha256').update(c).digest('hex'),
    );

    await db
      .update(userTwoFactor)
      .set({
        verified: true,
        enabled: true,
        backupCodes: hashedCodes,
        pendingCodeHash: null,
        pendingCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(userTwoFactor.userId, userId));

    this.logger.log(`2FA enabled for user ${userId}`);
    return { backupCodes };
  }

  async sendLoginCode(userId: string, email: string): Promise<void> {
    const code = this.generateCode();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(
      Date.now() + this.CODE_EXPIRY_MINUTES * 60 * 1000,
    );

    await db
      .update(userTwoFactor)
      .set({
        pendingCodeHash: codeHash,
        pendingCodeExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(userTwoFactor.userId, userId));

    await this.emailService.sendTwoFactorCode(email, code);
    this.logger.log(`2FA login code sent to ${email}`);
  }

  async validate(userId: string, code: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(userTwoFactor)
      .where(
        and(eq(userTwoFactor.userId, userId), eq(userTwoFactor.enabled, true)),
      );

    if (!row) return false;

    if (
      row.pendingCodeHash &&
      row.pendingCodeExpiresAt &&
      new Date() <= row.pendingCodeExpiresAt
    ) {
      const inputHash = crypto.createHash('sha256').update(code).digest('hex');
      if (inputHash === row.pendingCodeHash) {
        await db
          .update(userTwoFactor)
          .set({
            pendingCodeHash: null,
            pendingCodeExpiresAt: null,
            updatedAt: new Date(),
          })
          .where(eq(userTwoFactor.userId, userId));
        return true;
      }
    }

    const hashedInput = crypto.createHash('sha256').update(code).digest('hex');
    const codeIndex = row.backupCodes.indexOf(hashedInput);
    if (codeIndex !== -1) {
      const newCodes = [...row.backupCodes];
      newCodes.splice(codeIndex, 1);
      await db
        .update(userTwoFactor)
        .set({ backupCodes: newCodes, updatedAt: new Date() })
        .where(eq(userTwoFactor.userId, userId));
      return true;
    }

    return false;
  }

  async disable(userId: string): Promise<void> {
    const [row] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId));

    if (!row) return;

    await db
      .update(userTwoFactor)
      .set({
        enabled: false,
        verified: false,
        secret: '',
        backupCodes: [],
        pendingCodeHash: null,
        pendingCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(userTwoFactor.userId, userId));

    this.logger.log(`2FA disabled for user ${userId}`);
  }

  async regenerateBackupCodes(
    userId: string,
  ): Promise<{ backupCodes: string[] }> {
    const [row] = await db
      .select()
      .from(userTwoFactor)
      .where(eq(userTwoFactor.userId, userId));

    if (!row) {
      throw new NotFoundException('2FA not set up');
    }

    const backupCodes = this.generateBackupCodes();
    const hashedCodes = backupCodes.map((c) =>
      crypto.createHash('sha256').update(c).digest('hex'),
    );

    await db
      .update(userTwoFactor)
      .set({ backupCodes: hashedCodes, updatedAt: new Date() })
      .where(eq(userTwoFactor.userId, userId));

    return { backupCodes };
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }
}
