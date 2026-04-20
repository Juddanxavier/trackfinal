import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface Carrier {
  key: number;
  _country_iso: string;
  _name: string;
  name_zh_cn?: string;
  name_zh_hk?: string;
}

@Injectable()
export class CarrierService {
  private carriers: Carrier[] = [];
  private lastFetch: number = 0;
  private readonly CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  private readonly CARRIER_LIST_URL = 'https://res.17track.net/asset/carrier/info/apicarrier.all.json';

  constructor(private configService: ConfigService) {}

  async fetchCarrierList(): Promise<Carrier[]> {
    if (this.carriers.length > 0 && Date.now() - this.lastFetch < this.CACHE_TTL_MS) {
      return this.carriers;
    }

    try {
      const response = await fetch(this.CARRIER_LIST_URL);
      if (response.ok) {
        const data = await response.json();
        this.carriers = data.map((c: any) => ({
          key: c.key,
          _country_iso: c._country_iso,
          _name: c._name,
          name_zh_cn: c['_name_zh-cn'],
          name_zh_hk: c['_name_zh-hk'],
        }));
        this.lastFetch = Date.now();
        console.log(`[CarrierService] Loaded ${this.carriers.length} carriers`);
      }
    } catch (error) {
      console.error('[CarrierService] Failed to fetch carrier list:', error);
    }

    return this.carriers;
  }

  async findCarrierByCode(code: string): Promise<Carrier | null> {
    const carriers = await this.fetchCarrierList();
    const codeLower = code.toLowerCase();

    const carrier = carriers.find(c => {
      const keyStr = String(c.key);
      return keyStr === code || keyStr.toLowerCase() === codeLower;
    });

    return carrier || null;
  }

  async findCarrierByName(name: string): Promise<Carrier | null> {
    const carriers = await this.fetchCarrierList();
    const nameLower = name.toLowerCase();

    const carrier = carriers.find(c =>
      c._name.toLowerCase() === nameLower ||
      c.name_zh_cn?.toLowerCase() === nameLower ||
      c.name_zh_hk?.toLowerCase() === nameLower ||
      c._name.toLowerCase().includes(nameLower) ||
      nameLower.includes(c._name.toLowerCase())
    );

    return carrier || null;
  }

  async listCarriers(countryIso?: string): Promise<Carrier[]> {
    const carriers = await this.fetchCarrierList();
    if (countryIso) {
      return carriers.filter(c => c._country_iso.toUpperCase() === countryIso.toUpperCase());
    }
    return carriers;
  }

  async searchCarriers(query: string): Promise<Carrier[]> {
    const carriers = await this.fetchCarrierList();
    const queryLower = query.toLowerCase();

    return carriers.filter(c =>
      c._name.toLowerCase().includes(queryLower) ||
      c.name_zh_cn?.toLowerCase().includes(queryLower) ||
      c.name_zh_hk?.toLowerCase().includes(queryLower) ||
      String(c.key).includes(query)
    );
  }
}