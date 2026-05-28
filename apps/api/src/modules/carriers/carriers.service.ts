import { Injectable, Logger } from '@nestjs/common';
import { db } from '../../database';
import { carriers } from '../../database/schema/carriers';
import { eq } from 'drizzle-orm';
import { carrierPatterns } from './carrier-patterns';

export interface Carrier {
  key: string;
  name_en: string;
}

@Injectable()
export class CarriersService {
  private readonly logger = new Logger(CarriersService.name);
  async onModuleInit() {
    await this.loadCarriers();
  }

  private carriers: Carrier[] = [];

  private async loadCarriers() {
    try {
      const result = await db
        .select({
          key: carriers.key,
          nameEn: carriers.nameEn,
        })
        .from(carriers);
      this.carriers = result.map((r) => ({ key: r.key, name_en: r.nameEn }));
      this.logger.log(`[CarriersService] Loaded ${this.carriers.length} carriers`);
    } catch (err) {
      this.logger.error('[CarriersService] Failed to load carriers:', err);
      this.carriers = [];
    }
  }

  detectByTrackingNumber(trackingNumber: string): Carrier | null {
    const cleaned = trackingNumber.replace(/\s/g, '').toUpperCase();

    for (const { pattern, carrierKey } of carrierPatterns) {
      if (pattern.test(cleaned)) {
        const carrier = this.carriers.find((c) => c.key === carrierKey);
        if (carrier) {
          return carrier;
        }
      }
    }
    return null;
  }

  async getAllCarriers(): Promise<Carrier[]> {
    if (this.carriers.length === 0) {
      await this.loadCarriers();
    }
    return this.carriers;
  }

  async getCarrierByKey(key: string): Promise<Carrier | undefined> {
    if (this.carriers.length === 0) {
      await this.loadCarriers();
    }
    return this.carriers.find((c) => c.key === key);
  }

  async getCarriersByKeys(keys: string[]): Promise<Carrier[]> {
    if (this.carriers.length === 0) {
      await this.loadCarriers();
    }
    return this.carriers.filter((c) => keys.includes(c.key));
  }

  async isValidCarrier(key: string): Promise<boolean> {
    if (this.carriers.length === 0) {
      await this.loadCarriers();
    }
    return this.carriers.some((c) => c.key === key);
  }
}
