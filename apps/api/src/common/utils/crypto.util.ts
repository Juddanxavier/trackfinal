import * as crypto from 'crypto';

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

export function hashForStorage(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function generateSecureToken(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}
