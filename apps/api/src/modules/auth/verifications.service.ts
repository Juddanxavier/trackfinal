import { Injectable } from '@nestjs/common';
import { db } from '../../database';
import { verifications } from '../../database/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

@Injectable()
export class VerificationsService {
  async create(
    userId: string,
    type: 'email' | 'password-reset',
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await db.insert(verifications).values({
      userId,
      token,
      type,
      expiresAt,
    });

    return token;
  }

  async verify(
    token: string,
    type: 'email' | 'password-reset',
  ): Promise<string | null> {
    const result = await db
      .select()
      .from(verifications)
      .where(and(eq(verifications.token, token), eq(verifications.type, type)));

    const verification = result[0];
    if (!verification) return null;
    if (verification.usedAt) return null;
    if (verification.expiresAt < new Date()) return null;

    await db
      .update(verifications)
      .set({ usedAt: new Date() })
      .where(eq(verifications.id, verification.id));

    return verification.userId;
  }

  async findByUser(userId: string, type: 'email' | 'password-reset') {
    return db
      .select()
      .from(verifications)
      .where(
        and(eq(verifications.userId, userId), eq(verifications.type, type)),
      );
  }
}
