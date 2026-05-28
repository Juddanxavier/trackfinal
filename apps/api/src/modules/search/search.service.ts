import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../database';
import { shipments } from '../../database/schema/shipments';
import { quotes } from '../../database/schema/quotes';
import { users } from '../../database/schema/user';
import { organisations } from '../../database/schema/organisations';
import { ilike, or, eq, isNull, and } from 'drizzle-orm';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  async search(query: string, organisationId: string) {
    const q = `%${query}%`;

    const [shipmentResults, quoteResults, userResults] = await Promise.all([
      db
        .select({
          id: shipments.id,
          trackingNumber: shipments.trackingNumber,
          recipientName: shipments.recipientName,
          status: shipments.status,
          createdAt: shipments.createdAt,
        })
        .from(shipments)
        .where(
          and(
            eq(shipments.organisationId, organisationId),
            isNull(shipments.deletedAt),
            or(
              ilike(shipments.trackingNumber, q),
              ilike(shipments.recipientName, q),
              ilike(shipments.recipientEmail || '', q),
            ),
          ),
        )
        .limit(10),

      db
        .select({
          id: quotes.id,
          originCountry: quotes.originCountry,
          destinationCountry: quotes.destinationCountry,
          goodsType: quotes.goodsType,
          status: quotes.status,
          createdAt: quotes.createdAt,
        })
        .from(quotes)
        .where(
          and(
            eq(quotes.organisationId, organisationId),
            or(
              ilike(quotes.originCountry, q),
              ilike(quotes.destinationCountry, q),
              ilike(quotes.goodsType, q),
            ),
          ),
        )
        .limit(10),

      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          and(
            eq(users.organisationId, organisationId),
            or(ilike(users.name, q), ilike(users.email, q)),
          ),
        )
        .limit(10),
    ]);

    const results: any[] = [];

    for (const s of shipmentResults) {
      results.push({
        id: s.id,
        type: 'shipment',
        title: s.trackingNumber,
        description: s.recipientName,
        status: s.status,
        date: s.createdAt,
      });
    }

    for (const q of quoteResults) {
      results.push({
        id: q.id,
        type: 'quote',
        title: `${q.originCountry || ''} → ${q.destinationCountry || ''}`,
        description: q.goodsType,
        status: q.status,
        date: q.createdAt,
      });
    }

    for (const u of userResults) {
      results.push({
        id: u.id,
        type: 'user',
        title: u.name,
        description: u.email,
        status: u.role,
        date: u.createdAt,
      });
    }

    return results;
  }
}
