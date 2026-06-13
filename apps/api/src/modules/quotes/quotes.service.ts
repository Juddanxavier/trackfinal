import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { db } from '../../database';
import { quotes, quoteStatusEnum } from '../../database/schema/quotes';
import { notifications } from '../../database/schema/notifications';
import { eq, and, sql, like, or, desc, asc, isNull } from 'drizzle-orm';
import { UsersService } from '../users/services';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../auth/email.service';

const emailColors = {
  primary: '#0ea5e9',
  primaryDark: '#0284c7',
  bg: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  successLight: '#f0fdf4',
  warning: '#d97706',
  warningLight: '#fffbeb',
};

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Track Logistics</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: ${emailColors.bg}; color: ${emailColors.text}; line-height: 1.6; }
    @media (max-width: 480px) {
      .container { padding: 16px !important; }
      .body { padding: 24px 20px !important; }
      .footer { padding: 24px 20px !important; }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background: ${emailColors.bg};">
    <tr><td class="container" style="padding: 48px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto;">
        <tr><td style="text-align: center; padding-bottom: 24px;">
          <span style="display: inline-block; background: linear-gradient(135deg, ${emailColors.primary} 0%, ${emailColors.primaryDark} 100%); color: #fff; padding: 12px 28px; border-radius: 8px; font-size: 20px; font-weight: 700;">Track Logistics</span>
        </td></tr>
        <tr><td style="background: ${emailColors.surface}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid ${emailColors.border};">
          ${content}
        </td></tr>
        <tr><td class="footer" style="text-align: center; padding: 24px 20px; color: ${emailColors.textMuted}; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Track Logistics. All rights reserved.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function emailHeader(title: string, subtitle: string): string {
  return `<div style="background: linear-gradient(135deg, ${emailColors.primary} 0%, ${emailColors.primaryDark} 100%); color: #fff; padding: 32px 24px; text-align: center;">
  <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 700;">${title}</h1>
  <p style="margin: 0; font-size: 14px; opacity: 0.9;">${subtitle}</p>
</div>`;
}

function emailBody(content: string): string {
  return `<div style="padding: 24px;">${content}</div>`;
}

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);
  constructor(
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async create(data: {
    organisationId: string;
    branchId?: string | null;
    userId: string;
    originCountry: string;
    destinationCountry: string;
    goodsType: string;
    weight: any;
    email: string;
    phone: string;
    remarks?: string;
  }) {
    const allStaff = await this.usersService.findByOrganisation(
      data.organisationId,
    );
    const staff = allStaff.filter(
      (u) => u.role === 'staff' || u.role === 'admin',
    );

    const [quote] = await db
      .insert(quotes)
      .values({
        organisationId: data.organisationId,
        branchId: data.branchId || null,
        userId: data.userId,
        originCountry: data.originCountry,
        destinationCountry: data.destinationCountry,
        goodsType: data.goodsType || 'general',
        weight: String(data.weight),
        email: data.email,
        phone: data.phone,
        remarks: data.remarks || null,
        assignedToId: null,
      } as any)
      .returning();

    for (const s of staff) {
      await this.notificationsService.create(data.organisationId, {
        userId: s.id,
        titleKey: 'quote.assigned',
        data: {
          quoteId: quote.id,
          origin: data.originCountry,
          destination: data.destinationCountry,
          weight: data.weight,
          email: data.email,
        },
      });
    }

    return quote;
  }

  async update(
    id: string,
    data: { status?: any; price?: any; assignedToId?: any; remarks?: any },
    userId?: string,
  ) {
    const quote = await this.findById(id);
    const oldStatus = quote.status;

    const updateData: any = {
      status: data.status,
      price: data.price ? String(data.price) : undefined,
      updatedAt: new Date(),
    };

    if (data.remarks !== undefined) {
      updateData.remarks = data.remarks || null;
    }

    if (!data.assignedToId && userId) {
      updateData.assignedToId = userId;
    } else {
      updateData.assignedToId = data.assignedToId;
    }

    await db.update(quotes).set(updateData).where(eq(quotes.id, id));

    if (
      data.status !== oldStatus &&
      (data.status === 'quoted' ||
        data.status === 'accepted' ||
        data.status === 'rejected')
    ) {
      await this.emailService.sendQuoteStatusEmail(
        quote.email,
        quote.id,
        quote.originCountry,
        quote.destinationCountry,
        data.status,
        data.price,
        data.remarks,
      );

      const titleKey = `quote.${data.status}`;
      await this.notificationsService.create(quote.organisationId, {
        userId: quote.userId,
        titleKey,
        data: {
          quoteId: quote.id,
          origin: quote.originCountry,
          destination: quote.destinationCountry,
          price: data.price,
        },
      });
    }

    return this.findById(id);
  }

  async findById(id: string, includeDeleted = false) {
    const whereClause = includeDeleted
      ? eq(quotes.id, id)
      : and(eq(quotes.id, id), isNull(quotes.deletedAt));

    const [quote] = await db.select().from(quotes).where(whereClause);
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async findByUser(userId: string, organisationId?: string) {
    const filters: any[] = [
      eq(quotes.userId, userId),
      isNull(quotes.deletedAt),
    ];
    if (organisationId) filters.push(eq(quotes.organisationId, organisationId));
    return db
      .select()
      .from(quotes)
      .where(and(...filters));
  }

  async findPendingByOrganisation(organisationId?: string, branchId?: string) {
    const filters: any[] = [
      eq(quotes.status, 'pending'),
      isNull(quotes.deletedAt),
    ];
    if (organisationId) filters.unshift(eq(quotes.organisationId, organisationId));
    if (branchId) filters.push(eq(quotes.branchId, branchId));
    return db
      .select()
      .from(quotes)
      .where(and(...filters));
  }

  async delete(id: string, deletedBy: string, reason?: string) {
    const quote = await this.findById(id, true);
    if (quote.status === 'deleted') {
      throw new NotFoundException('Quote already deleted');
    }

    await db
      .update(quotes)
      .set({
        status: 'deleted',
        deletedAt: new Date(),
        deletedBy: deletedBy,
        deletedReason: reason || null,
      } as any)
      .where(eq(quotes.id, id));

    // Delete related notifications - use SQL jsonb operator for proper matching
    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.titleKey, 'quote.assigned'),
          sql`${notifications.data}->>'quoteId' = ${id}`,
        ),
      );

    return { message: 'Quote deleted successfully', id };
  }

  async findWithPagination(options: {
    organisationId?: string;
    branchId?: string;
    userId?: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const {
      organisationId,
      branchId,
      userId,
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const conditions: any[] = [isNull(quotes.deletedAt)];

    if (organisationId) {
      conditions.push(eq(quotes.organisationId, organisationId));
    }
    if (userId) {
      conditions.push(eq(quotes.userId, userId));
    }
    if (branchId) {
      conditions.push(eq(quotes.branchId, branchId));
    }
    if (status) {
      conditions.push(eq(quotes.status, status as any));
    }
    if (search) {
      conditions.push(
        or(
          like(quotes.email, `%${search}%`),
          like(quotes.originCountry, `%${search}%`),
          like(quotes.destinationCountry, `%${search}%`),
        ),
      );
    }

    const whereClause = and(...conditions);

    const offset = (page - 1) * limit;

    const orderColumn: any =
      sortBy === 'email'
        ? quotes.email
        : sortBy === 'originCountry'
          ? quotes.originCountry
          : sortBy === 'destinationCountry'
            ? quotes.destinationCountry
            : sortBy === 'status'
              ? quotes.status
              : quotes.createdAt;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    const [data, countResult] = await Promise.all([
      db
        .select()
        .from(quotes)
        .where(whereClause)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(whereClause),
    ]);

    const total = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async getStats(organisationId?: string, branchId?: string) {
    try {
      const filters: any[] = [isNull(quotes.deletedAt)];
      if (organisationId)
        filters.push(eq(quotes.organisationId, organisationId));
      if (branchId) filters.push(eq(quotes.branchId, branchId));
      const whereCondition = and(...filters);

      const allQuotes = await db.select().from(quotes).where(whereCondition);

      const total = allQuotes.length;
      const pending = allQuotes.filter((q) => q.status === 'pending').length;
      const quoted = allQuotes.filter((q) => q.status === 'quoted').length;
      const accepted = allQuotes.filter((q) => q.status === 'accepted').length;
      const rejected = allQuotes.filter((q) => q.status === 'rejected').length;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recent = allQuotes.filter(
        (q) => new Date(q.createdAt) >= sevenDaysAgo,
      ).length;

      return { total, pending, quoted, accepted, rejected, recent };
    } catch (err) {
      this.logger.error('[getStats] ERROR:', err);
      return {
        total: 0,
        pending: 0,
        quoted: 0,
        accepted: 0,
        rejected: 0,
        recent: 0,
      };
    }
  }

  async getActivityHistory(
    organisationId?: string,
    branchId?: string,
    days: number = 30,
  ) {
    try {
      const filters: any[] = [isNull(quotes.deletedAt)];
      if (organisationId)
        filters.push(eq(quotes.organisationId, organisationId));
      if (branchId) filters.push(eq(quotes.branchId, branchId));
      const whereClause = and(...filters);

      const allQuotes = await db.select().from(quotes).where(whereClause);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const historyMap = new Map<string, number>();
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const key = date.toISOString().split('T')[0];
        historyMap.set(key, 0);
      }

      allQuotes.forEach((q) => {
        if (q.createdAt) {
          const date = new Date(q.createdAt);
          if (date >= startDate) {
            const key = date.toISOString().split('T')[0];
            historyMap.set(key, (historyMap.get(key) || 0) + 1);
          }
        }
      });

      return Array.from(historyMap.entries())
        .map(([date, count]) => ({ date, quotes: count }))
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch (err) {
      this.logger.error('[getActivityHistory] ERROR:', err);
      return [];
    }
  }

  async getDeletedStats(organisationId?: string, branchId?: string) {
    const filters: any[] = [eq(quotes.status, 'deleted')];
    if (organisationId) filters.push(eq(quotes.organisationId, organisationId));
    if (branchId) filters.push(eq(quotes.branchId, branchId));

    const deletedQuotes = await db
      .select()
      .from(quotes)
      .where(and(...filters));

    const total = deletedQuotes.length;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const olderThanOneYear = deletedQuotes.filter(
      (q) => q.deletedAt && new Date(q.deletedAt) < oneYearAgo,
    ).length;

    return { total, olderThanOneYear };
  }

  async deleteOwn(id: string, userId: string) {
    const quote = await this.findById(id);
    if (quote.userId !== userId) {
      throw new ForbiddenException('You can only delete your own quotes');
    }
    if (quote.status !== 'pending') {
      throw new ForbiddenException('You can only delete pending quotes');
    }
    return this.delete(id, userId, 'Owner deleted');
  }

  async hardDelete(id: string) {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    if (!quote) throw new NotFoundException('Quote not found');
    await db.delete(quotes).where(eq(quotes.id, id));
    return { message: 'Quote permanently deleted', id };
  }

  async sendCustomEmail(
    email: string,
    subject: string,
    message: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.emailService.sendEmail({
      to: email,
      subject,
      html: emailWrapper(
        emailHeader('Message from Track Logistics', 'You have a new message') +
          emailBody(`<div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 16px; font-size: 14px; color: #334155; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin: 0; font-size: 14px; color: #64748b;">Best regards,<br/>Track Logistics Team</p>`),
      ),
    });
    return { success: true, message: 'Email sent successfully' };
  }
}
