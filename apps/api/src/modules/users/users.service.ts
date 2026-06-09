import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../database';
import { users } from '../../database/schema';
import { eq, like, or, and, desc, asc, ne, sql, isNotNull } from 'drizzle-orm';
import { Role } from '../../common/enums/role.enum';
import { CasbinService } from '../../common/casbin/casbin.service';

export interface FindWithPaginationParams {
  organisationId?: string;
  branchId?: string;
  page: number;
  limit: number;
  search?: string;
  role?: Role;
  excludeRoles?: Role[];
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
  private readonly logger = new Logger(UsersService.name);

  constructor(private casbinService: CasbinService) {}

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

  async findByPhoneNumber(
    phoneNumber: string,
    organisationId?: string,
    excludeUserId?: string,
  ) {
    if (!phoneNumber) return null;

    const cleanedInput = phoneNumber.replace(/\D/g, '').slice(-10);

    const conditions: any[] = [isNotNull(users.phoneNumber)];
    if (organisationId) {
      conditions.push(eq(users.organisationId, organisationId));
    }
    if (excludeUserId) {
      conditions.push(ne(users.id, excludeUserId));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];
    const potentialUsers = await db.select().from(users).where(whereClause);

    return (
      potentialUsers.find((u) => {
        if (!u.phoneNumber) return false;
        const cleanedUser = u.phoneNumber.replace(/\D/g, '').slice(-10);
        return cleanedUser === cleanedInput;
      }) || null
    );
  }

  async lookupUser(
    email?: string,
    phoneNumber?: string,
    organisationId?: string,
  ) {
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
      const user = await this.findByPhoneNumber(phoneNumber, organisationId);
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
      branchId,
      page = 1,
      limit = 10,
      search,
      role,
      excludeRoles,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;
    const offset = (page - 1) * limit;

    const conditions: any[] = organisationId
      ? [eq(users.organisationId, organisationId)]
      : [];

    if (branchId) {
      conditions.push(eq(users.branchId, branchId));
    }

    if (search) {
      conditions.push(
        or(like(users.name, `%${search}%`), like(users.email, `%${search}%`)),
      );
    }

    if (role) {
      conditions.push(eq(users.role, role as 'admin' | 'staff' | 'customer'));
    }

    if (excludeRoles && excludeRoles.length > 0) {
      for (const excludedRole of excludeRoles) {
        conditions.push(ne(users.role, excludedRole));
      }
    }

    const whereClause =
      conditions.length > 1
        ? and(...conditions)
        : conditions.length === 1
          ? conditions[0]
          : undefined;

    const orderColumn = (users as any)[sortBy] || users.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);
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
    const baseCondition = organisationId
      ? eq(users.organisationId, organisationId)
      : undefined;

    const [totalResult, activeResult, customersResult, staffResult] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(baseCondition),
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            baseCondition
              ? and(baseCondition, eq(users.isActive, true))
              : eq(users.isActive, true),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            baseCondition
              ? and(baseCondition, eq(users.role, Role.CUSTOMER))
              : eq(users.role, Role.CUSTOMER),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(users)
          .where(
            baseCondition
              ? and(
                  baseCondition,
                  or(eq(users.role, Role.STAFF), eq(users.role, Role.ADMIN)),
                )
              : or(eq(users.role, Role.STAFF), eq(users.role, Role.ADMIN)),
          ),
      ]);

    return {
      total: Number(totalResult[0]?.count || 0),
      active: Number(activeResult[0]?.count || 0),
      customers: Number(customersResult[0]?.count || 0),
      staff: Number(staffResult[0]?.count || 0),
    };
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
        role: (data.role || Role.CUSTOMER) as 'admin' | 'staff' | 'customer',
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
    phoneNumber?: string;
    role?: Role;
    googleId?: string;
    organisationId?: string;
    branchId?: string | null;
    isActive?: boolean;
    emailVerified?: boolean;
  }) {
    const role = (data.role || Role.CUSTOMER) as 'admin' | 'staff' | 'customer';
    const result = await db
      .insert(users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        phoneNumber: data.phoneNumber || null,
        role,
        googleId: data.googleId,
        organisationId: data.organisationId,
        branchId: data.branchId || null,
        isActive: data.isActive ?? false,
        emailVerified: data.emailVerified || false,
      })
      .returning();

    const user = result[0];

    try {
      await this.casbinService.syncUserRole(user.id, role, data.organisationId);
      this.logger.log(`User ${user.id} role '${role}' synced to Casbin`);

      if (role === Role.STAFF && data.branchId) {
        await this.casbinService.setUserBranchPermissions(
          user.id,
          data.branchId,
          role,
        );
        this.logger.log(
          `User ${user.id} branch permissions set for branch '${data.branchId}'`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to sync role to Casbin: ${error}`);
    }

    return user;
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
      branchId: string | null;
      isActive: boolean;
      emailVerified: boolean;
    }>,
  ) {
    const oldUser = await this.findById(id);

    if (data.phoneNumber) {
      const existing = await this.findByPhoneNumber(
        data.phoneNumber,
        oldUser?.organisationId ?? undefined,
        id,
      );
      if (existing) {
        throw new Error('Phone number already in use');
      }
    }

    const oldBranchId = oldUser?.branchId;
    const updateData = {
      ...data,
      role: data.role
        ? (data.role as 'admin' | 'staff' | 'customer')
        : undefined,
      updatedAt: new Date(),
    };
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    const user = result[0];

    if (data.role && data.role !== oldUser?.role) {
      try {
        await this.casbinService.syncUserRole(
          user.id,
          data.role,
          user.organisationId || undefined,
        );
        this.logger.log(
          `User ${user.id} role updated to '${data.role}' in Casbin`,
        );
      } catch (error) {
        this.logger.error(`Failed to sync role to Casbin: ${error}`);
      }
    }

    if (
      data.branchId !== undefined &&
      data.branchId !== oldBranchId &&
      user.role === Role.STAFF
    ) {
      try {
        if (oldBranchId) {
          await this.casbinService.clearUserBranchPermissions(
            user.id,
            oldBranchId,
          );
        }
        if (data.branchId) {
          await this.casbinService.setUserBranchPermissions(
            user.id,
            data.branchId,
            Role.STAFF,
          );
        }
        this.logger.log(
          `User ${user.id} branch permissions updated from '${oldBranchId}' to '${data.branchId}'`,
        );
      } catch (error) {
        this.logger.error(`Failed to update branch permissions: ${error}`);
      }
    }

    return user;
  }

  async remove(id: string) {
    try {
      await this.casbinService.deleteUser(id);
      this.logger.log(`User ${id} removed from Casbin`);
    } catch (error) {
      this.logger.warn(`Failed to remove user from Casbin: ${error}`);
    }

    await db.delete(users).where(eq(users.id, id));
    return { message: 'User deleted' };
  }
}
