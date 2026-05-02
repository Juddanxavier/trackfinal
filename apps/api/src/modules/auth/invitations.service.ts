import { Injectable } from '@nestjs/common';
import { db } from '../../database';
import { invitationStatuses } from '../../database/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { EmailService } from './email.service';
import { UsersService } from '../users/services';
import { Role } from '../../common/enums/role.enum';
import type { QueryResult } from 'pg';

export interface CreateInvitationDto {
  email: string;
  role: 'admin' | 'staff';
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
      throw new Error('Invitation already sent to this email');
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [invitation] = await db
      .insert(invitationStatuses)
      .values({
        email: dto.email,
        organisationId,
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

  async findAcceptedByOrganisation(organisationId: string) {
    return db
      .select()
      .from(invitationStatuses)
      .where(and(eq(invitationStatuses.organisationId, organisationId)));
  }
}
