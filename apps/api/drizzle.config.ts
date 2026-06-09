import { defineConfig } from 'drizzle-kit';

const dbUrl = process.env.DATABASE_URL!.includes('sslmode')
  ? process.env.DATABASE_URL!
  : process.env.DATABASE_URL! + '?sslmode=disable';

export default defineConfig({
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: dbUrl,
  },
});
