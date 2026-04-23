import { Injectable } from '@nestjs/common';
import { db } from '../../database';
import { users, organisations, sessions } from '../../database/schema';
import { eq, like, or, and, desc, asc, lt, ne } from 'drizzle-orm';
import { Role } from '../../common/enums/role.enum';

export interface FindWithPaginationParams {
  organisationId: string;
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UsersService {
  async findByEmail(email: string) {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async findById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async findByGoogleId(googleId: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return result[0];
  }

  async findByGoogleIdOrEmail(googleId: string, email: string) {
    const result = await db
      .select()
      .from(users)
      .where(or(eq(users.googleId, googleId), eq(users.email, email)));
    return result[0];
  }

  async findByPhoneNumber(phoneNumber: string, excludeUserId?: string) {
    const allUsers = await db.select().from(users);
    const cleanedInput = phoneNumber.replace(/\D/g, '').slice(-10);

    return (
      allUsers.find((u) => {
        if (excludeUserId && u.id === excludeUserId) return false;
        if (!u.phoneNumber) return false;
        const cleanedUser = u.phoneNumber.replace(/\D/g, '').slice(-10);
        return cleanedUser === cleanedInput;
      }) || null
    );
  }

  async lookupUser(email?: string, phoneNumber?: string) {
    if (email) {
      const user = await this.findByEmail(email);
      if (user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        };
      }
    }
    if (phoneNumber) {
      const user = await this.findByPhoneNumber(phoneNumber);
      if (user) {
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
        };
      }
    }
    return null;
  }

  async findByOrganisation(organisationId: string) {
    return db
      .select()
      .from(users)
      .where(eq(users.organisationId, organisationId));
  }

  async findStaffByOrganisation(organisationId: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.organisationId, organisationId));
    const staff = result.filter(
      (u) => u.role === Role.STAFF || u.role === Role.ADMIN,
    );
    if (staff.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * staff.length);
    return staff[randomIndex];
  }

  async findWithPagination(
    params: FindWithPaginationParams,
  ): Promise<PaginatedResult<any>> {
    const {
      organisationId,
      page = 1,
      limit = 10,
      search,
      role,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = organisationId
      ? [eq(users.organisationId, organisationId)]
      : [];

    if (search) {
      conditions.push(
        or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)),
      );
    }

    if (role) {
      conditions.push(eq(users.role, role));
    }

    const whereClause =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

    const orderColumn = (users as any)[sortBy] || users.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [data, allData] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      db.select().from(users).where(whereClause),
    ]);

    const total = allData.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getAllStats(organisationId?: string) {
    let allUsers = await db.select().from(users);

    if (organisationId) {
      allUsers = allUsers.filter((u) => u.organisationId === organisationId);
    }

    const total = allUsers.length;
    const active = allUsers.filter((u) => u.isActive).length;
    const customers = allUsers.filter((u) => u.role === Role.CUSTOMER).length;
    const staff = allUsers.filter(
      (u) => u.role === Role.STAFF || u.role === Role.ADMIN,
    ).length;

    return { total, active, customers, staff };
  }

  async invite(data: {
    email: string;
    name: string;
    phoneNumber?: string;
    role?: Role;
    organisationId: string;
  }) {
    if (data.phoneNumber) {
      const existing = await this.findByPhoneNumber(data.phoneNumber);
      if (existing) {
        throw new Error('Phone number already in use');
      }
    }
    const result = await db
      .insert(users)
      .values({
        email: data.email,
        name: data.name,
        phoneNumber: data.phoneNumber || null,
        role: data.role || Role.CUSTOMER,
        organisationId: data.organisationId,
        isActive: true,
        emailVerified: false,
      })
      .returning();
    return {
      ...result[0],
      message: 'User invited successfully',
    };
  }

  async create(data: {
    email: string;
    passwordHash?: string;
    name: string;
    role?: Role;
    googleId?: string;
    organisationId?: string;
    emailVerified?: boolean;
  }) {
    const result = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: data.role || Role.CUSTOMER,
        googleId: data.googleId,
        organisationId: data.organisationId,
        emailVerified: data.emailVerified || false,
      })
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<{
      email: string;
      passwordHash: string;
      name: string;
      phoneNumber: string | null;
      role: Role;
      googleId: string;
      organisationId: string;
      isActive: boolean;
      emailVerified: boolean;
    }>,
  ) {
    if (data.phoneNumber) {
      const existing = await this.findByPhoneNumber(data.phoneNumber, id);
      if (existing) {
        throw new Error('Phone number already in use');
      }
    }
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string) {
    await db.delete(users).where(eq(users.id, id));
    return { message: 'User deleted' };
  }
}

@Injectable()
export class OrganisationsService {
  async findAll() {
    return db.select().from(organisations);
  }

  async findById(id: string) {
    const result = await db
      .select()
      .from(organisations)
      .where(eq(organisations.id, id));
    return result[0];
  }

  async findBySlug(slug: string) {
    const result = await db
      .select()
      .from(organisations)
      .where(eq(organisations.slug, slug));
    return result[0];
  }

  async create(data: { name: string; slug: string }) {
    const result = await db
      .insert(organisations)
      .values({
        name: data.name,
        slug: data.slug,
      })
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<{ name: string; slug: string; isActive: boolean }>,
  ) {
    const result = await db
      .update(organisations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organisations.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string) {
    await db.delete(organisations).where(eq(organisations.id, id));
    return { message: 'Organisation deleted' };
  }
}

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
    const result = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, id));
    return result[0] || null;
  }

  async findByUserId(userId: string): Promise<typeof sessions.$inferSelect[]> {
    return db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.revoked, false),
        ),
      );
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
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.revoked, false),
        ),
      );
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await db
      .update(sessions)
      .set({ revoked: true, revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, userId),
          eq(sessions.revoked, false),
        ),
      );
  }

  async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
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
      .where(
        or(
          eq(sessions.revoked, true),
          lt(sessions.expiresAt, now),
        ),
      );
    return result.rowCount || 0;
  }
}
