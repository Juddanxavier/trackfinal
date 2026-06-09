import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer-core';
import { existsSync } from 'fs';
import { buildInvoiceHtml } from './invoice-template';

interface InvoiceData {
  trackingNumber: string;
  whiteLabelTrackingCode?: string;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientAddress?: string;
  originCountry?: string;
  destinationCountry?: string;
  status: string;
  billAmount?: string;
  createdAt: Date;
  deliveredAt?: Date;
  orgName: string;
  orgAddress: string;
  orgEmail: string;
  orgPhone: string;
  branchName: string;
}

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];

function findChrome(): string | undefined {
  if (process.env.CHROME_EXECUTABLE_PATH)
    return process.env.CHROME_EXECUTABLE_PATH;
  for (const p of CHROME_PATHS) {
    if (existsSync(p)) return p;
  }
  return undefined;
}

@Injectable()
export class InvoicesService {
  async generateShipmentInvoice(data: InvoiceData): Promise<Buffer> {
    const html = buildInvoiceHtml(data);
    const chromePath = findChrome();

    if (!chromePath) {
      throw new Error('No browser found for PDF generation');
    }

    const browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });

      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
