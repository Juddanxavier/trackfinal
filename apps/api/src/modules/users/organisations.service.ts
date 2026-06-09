import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../database';
import { organisations, branches } from '../../database/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class OrganisationsService {
  private readonly logger = new Logger(OrganisationsService.name);

  async findAll(organisationId?: string) {
    this.logger.log('findAll called with orgId:' + organisationId);
    if (organisationId) {
      const org = await db
        .select()
        .from(organisations)
        .where(eq(organisations.id, organisationId));
      return org;
    }
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

  async findByTrackingDomain(domain: string) {
    const result = await db
      .select()
      .from(organisations)
      .where(eq(organisations.trackingDomain, domain));
    return result[0];
  }

  async create(data: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
    currency?: string;
    logoUrl?: string;
  }) {
    const result = await db
      .insert(organisations)
      .values({
        name: data.name,
        slug: data.slug,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        countryCode: data.countryCode,
        currency: data.currency,
        logoUrl: data.logoUrl,
      })
      .returning();
    return result[0];
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      slug: string;
      isActive: boolean;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
      countryCode: string;
      currency: string;
      logoUrl: string;
    }>,
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

  async getOrgTree() {
    const allOrgs = await db.select().from(organisations);
    const allBranches = await db
      .select()
      .from(branches)
      .where(eq(branches.isActive, true));

    return allOrgs.map((org) => ({
      ...org,
      children: allBranches
        .filter((b) => b.organisationId === org.id)
        .map((branch) => ({
          ...branch,
          children: [],
        })),
    }));
  }

  async getBranches(organisationId: string) {
    return db
      .select()
      .from(branches)
      .where(
        and(
          eq(branches.organisationId, organisationId),
          eq(branches.isActive, true),
        ),
      );
  }

  async getBranchHierarchy(organisationId: string) {
    const branchList = await this.getBranches(organisationId);
    return branchList.map((branch) => ({
      ...branch,
      children: [],
    }));
  }

  async getUserAccessibleOrgs(
    userId: string,
    userRole: string,
    userOrganisationId: string | null,
  ) {
    if (!userOrganisationId) {
      return [];
    }

    const userOrg = await this.findById(userOrganisationId);
    if (!userOrg) return [];

    const accessibleOrgs: any[] = [userOrg];

    const branchList = await this.getBranches(userOrganisationId);
    accessibleOrgs.push(
      ...branchList.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.name.toLowerCase().replace(/\s+/g, '-'),
        email: b.email,
        phone: b.phone,
        address: b.address,
        city: b.city,
        state: b.state,
        postalCode: b.postalCode,
        countryCode: b.countryCode,
        currency: null,
        logoUrl: null,
        websiteUrl: null,
        trackingDomain: null,
        isActive: b.isActive,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    );

    return accessibleOrgs;
  }

  async createBranch(data: {
    organisationId: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
  }) {
    let countryCode = data.countryCode;
    if (!countryCode) {
      const org = await db
        .select()
        .from(organisations)
        .where(eq(organisations.id, data.organisationId))
        .then((r) => r[0]);
      countryCode = org?.countryCode || 'US';
    }

    const result = await db
      .insert(branches)
      .values({
        organisationId: data.organisationId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        countryCode,
      })
      .returning();
    return result[0];
  }

  async updateBranch(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      postalCode: string;
      countryCode: string;
      isActive: boolean;
    }>,
  ) {
    const result = await db
      .update(branches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(branches.id, id))
      .returning();
    return result[0];
  }

  async removeBranch(id: string) {
    await db
      .update(branches)
      .set({ isActive: false })
      .where(eq(branches.id, id));
    return { message: 'Branch deactivated' };
  }
}
