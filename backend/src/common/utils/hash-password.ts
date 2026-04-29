import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

function getBcryptRounds(configService: ConfigService): number {
  const roundsStr = configService.get<string>('BCRYPT_ROUNDS');
  if (!roundsStr) return 12;
  const rounds = parseInt(roundsStr, 10);
  if (isNaN(rounds) || rounds < 10) return 12;
  if (rounds > 14) {
    console.warn(
      `BCRYPT_ROUNDS of ${rounds} is very high and may cause slow authentication`,
    );
  }
  return rounds;
}

export async function hashPassword(
  password: string,
  configService?: ConfigService,
): Promise<string> {
  const rounds = configService ? getBcryptRounds(configService) : 12;
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  if (!hash || typeof hash !== 'string' || hash.length !== 60) {
    return false;
  }
  try {
    return bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
