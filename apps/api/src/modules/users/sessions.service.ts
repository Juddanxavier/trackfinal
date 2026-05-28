import { Injectable } from '@nestjs/common';
import { db } from '../../database';
import { sessions } from '../../database/schema';
import { eq, and, ne, or, lt } from 'drizzle-orm';

@Injectable()
export class SessionsService {
  async findByTokenHash(tokenHash: string) {
    const result = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, tokenHash),
          eq(sessions.revoked, false),
        ),
      );
    return result[0] || null;
  }

  async findById(id: string) {
    const result = await db.select().from(sessions).where(eq(sessions.id, id));
    return result[0] || null;
  }

  async findByUserId(
    userId: string,
  ): Promise<(typeof sessions.$inferSelect)[]> {
    return db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.revoked, false)));
  }

  async create(data: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    const result = await db
      .insert(sessions)
      .values({
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        expiresAt: data.expiresAt,
        userAgent: data.userAgent,
        ipAddress: data.ipAddress,
      })
      .returning();
    return result[0];
  }

  async revoke(id: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(eq(sessions.id, id));
  }

  async revokeByUserId(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), eq(sessions.revoked, false)));
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(and(eq(sessions.userId, userId), eq(sessions.revoked, false)));
  }

  async revokeAllOtherSessions(
    userId: string,
    currentSessionId: string,
  ): Promise<void> {
    await db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.revoked, false),
          ne(sessions.id, currentSessionId),
        ),
      );
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    const result = await db
      .delete(sessions)
      .where(or(eq(sessions.revoked, true), lt(sessions.expiresAt, now)));
    return result.rowCount || 0;
  }
}
