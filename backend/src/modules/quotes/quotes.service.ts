import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { db } from '../../database';
import { quotes, quoteStatusEnum } from '../../database/schema/quotes';
import { notifications } from '../../database/schema/notifications';
import { eq, and, sql, like, or, desc, asc, isNull } from 'drizzle-orm';
import { UsersService } from '../users/services';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../auth/email.service';

@Injectable()
export class QuotesService {
  constructor(
    private usersService: UsersService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async create(data: {
    organisationId: string;
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
        },
      });
    }

    return quote;
  }

  async update(
    id: string,
    data: { status?: any; price?: any; assignedToId?: any },
    userId?: string,
  ) {
    const quote = await this.findById(id);
    const oldStatus = quote.status;

    const updateData: any = {
      status: data.status,
      price: data.price ? String(data.price) : undefined,
      updatedAt: new Date(),
    };

    if (!data.assignedToId && userId) {
      updateData.assignedToId = userId;
    } else {
      updateData.assignedToId = data.assignedToId;
    }

    await db.update(quotes).set(updateData).where(eq(quotes.id, id));

    if (data.status && data.status !== oldStatus) {
      await this.sendStatusEmail(quote, data.status, data.price);
    }

    return this.findById(id);
  }

  private async sendStatusEmail(quote: any, status: string, price?: string) {
    const subject =
      status === 'quoted'
        ? 'Your Quote is Ready'
        : status === 'accepted'
          ? 'Your Quote has been Accepted'
          : 'Your Quote Status Update';

    let html = '';
    if (status === 'quoted' && price) {
      html = `<p>Your quote has been processed. The quoted price is: <strong>$${price}</strong></p>
             <p>Log in to view the full details.</p>`;
    } else if (status === 'accepted') {
      html = `<p>Great news! Your quote has been <strong>accepted</strong>.</p>
             <p>Thank you for your business!</p>`;
    } else if (status === 'rejected') {
      html = `<p>Unfortunately, your quote was not accepted this time.</p>
             <p>Please contact us if you have any questions.</p>`;
    }

    if (html) {
      await this.emailService.sendEmail({
        to: quote.email,
        subject,
        html,
      });
    }
  }

  async findById(id: string, includeDeleted = false) {
    const whereClause = includeDeleted
      ? eq(quotes.id, id)
      : and(eq(quotes.id, id), isNull(quotes.deletedAt));

    const [quote] = await db
      .select()
      .from(quotes)
      .where(whereClause as any);
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async findByUser(userId: string) {
    return db
      .select()
      .from(quotes)
      .where(and(eq(quotes.userId, userId), isNull(quotes.deletedAt)));
  }

  async findPendingByOrganisation(organisationId: string) {
    return db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.organisationId, organisationId),
          eq(quotes.status, 'pending'),
          isNull(quotes.deletedAt),
        ),
      );
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

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.titleKey, 'quote.assigned'),
          eq(notifications.data, { quoteId: id } as any),
        ),
      );

    return { message: 'Quote deleted successfully', id };
  }

  async findWithPagination(options: {
    organisationId?: string;
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

    const [data, allData] = await Promise.all([
      db
        .select()
        .from(quotes)
        .where(whereClause)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset),
      db.select().from(quotes).where(whereClause),
    ]);

    const total = allData.length;
    const totalPages = Math.ceil(total / limit);

    return { data, total, page, limit, totalPages };
  }

  async getStats(organisationId?: string) {
    const allQuotes = await db
      .select()
      .from(quotes)
      .where(
        organisationId
          ? and(
              eq(quotes.organisationId, organisationId),
              isNull(quotes.deletedAt),
            )
          : isNull(quotes.deletedAt),
      );

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
  }

  async getDeletedStats(organisationId?: string) {
    const deletedQuotes = await db
      .select()
      .from(quotes)
      .where(
        organisationId
          ? and(
              eq(quotes.organisationId, organisationId),
              eq(quotes.status, 'deleted'),
            )
          : eq(quotes.status, 'deleted'),
      );

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
}
