import { Injectable, NotFoundException } from '@nestjs/common';
import { db } from '../../database';
import { quotes } from '../../database/schema/quotes';
import { eq, and, sql } from 'drizzle-orm';
import { UsersService } from '../users/services';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class QuotesService {
  constructor(
    private usersService: UsersService,
    private notificationsService: NotificationsService,
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
    const allStaff = await this.usersService.findByOrganisation(data.organisationId);
    const staff = allStaff.filter(u => u.role === 'staff' || u.role === 'admin');

    const [quote] = await db.insert(quotes).values({
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
    } as any).returning();

    for (const s of staff) {
      await this.notificationsService.create(data.organisationId, {
        userId: s.id,
        titleKey: 'quote.assigned',
        data: { quoteId: quote.id, origin: data.originCountry, destination: data.destinationCountry },
      });
    }

    return quote;
  }

  async update(id: string, data: { status?: any; price?: any; assignedToId?: any }, userId?: string) {
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

    await db.update(quotes).set(updateData as any).where(eq(quotes.id, id));

    return this.findById(id);
  }

  async findById(id: string) {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    if (!quote) throw new NotFoundException('Quote not found');
    return quote;
  }

  async findByUser(userId: string) {
    return db.select().from(quotes).where(eq(quotes.userId, userId));
  }

  async findByOrganisation(organisationId: string) {
    return db.select().from(quotes).where(eq(quotes.organisationId, organisationId));
  }

  async findPendingByOrganisation(organisationId: string) {
    return db.select().from(quotes).where(
      and(
        eq(quotes.organisationId, organisationId),
        eq(quotes.status, 'pending')
      )
    );
  }

}