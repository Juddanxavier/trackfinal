import { Injectable } from '@nestjs/common';
import { db } from '../../database';
import { invitationStatuses, organisations } from '../../database/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { EmailService } from './email.service';
import { UsersService } from '../users/services';
import { Role } from '../../common/enums/role.enum';
import type { QueryResult } from 'pg';

export interface CreateInvitationDto {
  email: string;
  role: 'admin' | 'staff';
  branchId?: string | null;
}

@Injectable()
export class InvitationsService {
  constructor(
    private emailService: EmailService,
    private usersService: UsersService,
  ) {}

  async create(
    organisationId: string,
    createdBy: string,
    dto: CreateInvitationDto,
    inviterName: string,
    organisationName: string,
  ): Promise<{ id: string; email: string; role: string }> {
    try {
      const existing = await db
        .select()
        .from(invitationStatuses)
        .where(
          and(
            eq(invitationStatuses.email, dto.email),
            eq(invitationStatuses.organisationId, organisationId),
            isNull(invitationStatuses.acceptedAt),
          ),
        );

      if (existing.length > 0) {
        throw new Error(
          'Invitation already sent to this email for this organisation',
        );
      }
    } catch (error: any) {
      throw new Error(error?.message || 'Failed to create invitation');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [invitation] = await db
      .insert(invitationStatuses)
      .values({
        email: dto.email,
        organisationId,
        branchId: dto.branchId || null,
        role: dto.role,
        token,
        expiresAt,
        createdBy,
      })
      .returning();

    await this.emailService.sendInvitationEmail(
      dto.email,
      token,
      inviterName,
      organisationName,
    );

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
    };
  }

  async verify(token: string): Promise<{
    id: string;
    email: string;
    organisationId: string;
    branchId: string | null;
    role: string;
  } | null> {
    const result = await db
      .select()
      .from(invitationStatuses)
      .where(eq(invitationStatuses.token, token));

    const invitation = result[0];
    if (!invitation) return null;
    if (invitation.acceptedAt) return null;
    if (invitation.expiresAt < new Date()) return null;

    return {
      id: invitation.id,
      email: invitation.email,
      organisationId: invitation.organisationId,
      branchId: invitation.branchId,
      role: invitation.role,
    };
  }

  async accept(invitationId: string, userId: string): Promise<void> {
    await db
      .update(invitationStatuses)
      .set({
        userId,
        acceptedAt: new Date(),
      })
      .where(eq(invitationStatuses.id, invitationId));
  }

  async findByOrganisation(organisationId: string) {
    return db
      .select()
      .from(invitationStatuses)
      .where(
        and(
          eq(invitationStatuses.organisationId, organisationId),
          isNull(invitationStatuses.acceptedAt),
        ),
      );
  }

  async findAllPending() {
    return db
      .select()
      .from(invitationStatuses)
      .where(isNull(invitationStatuses.acceptedAt));
  }

  async delete(invitationId: string): Promise<QueryResult<never>> {
    return db
      .delete(invitationStatuses)
      .where(eq(invitationStatuses.id, invitationId));
  }

  async resend(invitationId: string): Promise<{ id: string; email: string }> {
    const invitation = await db
      .select()
      .from(invitationStatuses)
      .where(eq(invitationStatuses.id, invitationId))
      .then((r) => r[0]);

    if (!invitation) {
      throw new Error('Invitation not found');
    }
    if (invitation.acceptedAt) {
      throw new Error('Invitation already accepted');
    }

    // Generate new token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db
      .update(invitationStatuses)
      .set({ token, expiresAt })
      .where(eq(invitationStatuses.id, invitationId));

    const org = await db.query.organisations.findFirst({
      where: eq(organisations.id, invitation.organisationId),
    });

    await this.emailService.sendInvitationEmail(
      invitation.email,
      token,
      'Admin',
      org?.name || 'Unknown',
    );

    return { id: invitation.id, email: invitation.email };
  }

  async findAcceptedByOrganisation(organisationId: string) {
    return db
      .select()
      .from(invitationStatuses)
      .where(and(eq(invitationStatuses.organisationId, organisationId)));
  }
}
